import type { NextRequest } from "next/server";
import type { Types } from "mongoose";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import Jar from "@/models/Jar";
import Recipiente from "@/models/Recipiente";
import FungusType from "@/models/FungusType";
import Clonacion from "@/models/Clonacion";
import { ok, handleApiError, notFound, conflict } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { updateBatchSchema } from "@/lib/validations/batch.schema";
import { resumenLote, type LeanBatch, type LeanJar, type LeanRecipiente } from "@/lib/metrics";
import { resumenComercialLote } from "@/lib/ventas";
import { disponiblePorLote } from "@/lib/ventas-server";

// numeroLote = [<iniciales del hongo>-]L-<anio>-<seq>. La parte L-... sale
// del Counter y no cambia nunca; las iniciales siguen al hongo.
const NUMERO_LOTE = /^(?:[A-Z]{1,4}-)?(L-\d{4}-\d+)$/;
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;

    const batch = await Batch.findOne({ _id: id, userId })
      .populate("fungusTypeId")
      .populate("inoculacionGrano.tipoGranoId")
      .populate("origenFrascoLiquidoId", "numeroGuia")
      .lean();

    if (!batch) throw notFound("lote_no_encontrado:Lote no encontrado");

    const [jars, recipientes] = await Promise.all([
      Jar.find({ batchId: id, userId }).sort({ numeroGuia: 1 }).lean(),
      Recipiente.find({ batchId: id, userId })
        .populate("tipoSustratoId")
        .populate("origenFrascoIds", "numeroGuia")
        .sort({ numeroSeguimiento: 1 })
        .lean(),
    ]);

    // Resumen comercial: stock (cosechado − vendido − merma), ingresos y
    // margen = ingresos − costoTotal (grano + sustrato, mismo costo que
    // resumenLote/estadisticas).
    const stock = (await disponiblePorLote(userId, [id])).get(id)!;
    const { costoTotal } = resumenLote(
      batch as unknown as LeanBatch,
      jars as unknown as LeanJar[],
      recipientes as unknown as LeanRecipiente[]
    ).costoProduccion;
    const comercial = resumenComercialLote({ ...stock, costoTotal });

    return ok({ ...batch, jars, recipientes, comercial });
  } catch (err) {
    return handleApiError(err);
  }
}

// PATCH /api/batches/[id] { fungusTypeId?, fechaInicio? }
// Corrige el tipo de hongo y/o la fecha de inoculacion de un lote ya
// creado. Si el hongo nuevo tiene otras iniciales, se renombra el lote y,
// en cascada, los codigos de sus frascos (-F..) y recipientes (-R..).
// No se permite cambiar el hongo si el lote salio de un frasco de micelio
// liquido (el hongo se deriva de ese frasco) ni si ya hay clonaciones
// hechas desde este lote (heredaron el hongo).
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = updateBatchSchema.parse(body);

    const batch = await Batch.findOne({ _id: id, userId });
    if (!batch) throw notFound("lote_no_encontrado:Lote no encontrado");

    const cambiaHongo =
      !!parsed.fungusTypeId && parsed.fungusTypeId !== String(batch.fungusTypeId);

    if (cambiaHongo) {
      if (batch.origenFrascoLiquidoId) {
        throw conflict(
          "lote_hongo_derivado_de_frasco_liquido:El hongo de este lote viene del frasco de micelio líquido de origen y no se puede cambiar"
        );
      }
      if (await Clonacion.exists({ userId, origenBatchId: batch._id })) {
        throw conflict(
          "lote_con_clonaciones:Ya hay clonaciones hechas desde este lote, no se puede cambiar el hongo"
        );
      }

      const [hongoNuevo, hongoAnterior] = await Promise.all([
        FungusType.findOne({ _id: parsed.fungusTypeId, userId }).lean(),
        FungusType.findOne({ _id: batch.fungusTypeId, userId }).lean(),
      ]);
      if (!hongoNuevo) throw notFound("tipo_hongo_no_existe:El tipo de hongo indicado no existe");

      // Si los dias esperados eran el default del hongo anterior (no los
      // edito el usuario), pasan a ser el default del hongo nuevo.
      if (
        hongoAnterior &&
        batch.inoculacionGrano.diasEsperados ===
          hongoAnterior.diasEsperadosDefault.inoculacionGrano
      ) {
        batch.inoculacionGrano.diasEsperados = hongoNuevo.diasEsperadosDefault.inoculacionGrano;
      }

      const match = NUMERO_LOTE.exec(batch.numeroLote);
      const anterior = batch.numeroLote;
      const nuevo = match
        ? hongoNuevo.iniciales
          ? `${hongoNuevo.iniciales}-${match[1]}`
          : match[1]
        : anterior;

      if (nuevo !== anterior) {
        if (await Batch.exists({ userId, numeroLote: nuevo })) {
          throw conflict(`numero_lote_en_uso:Ya existe un lote con el número '${nuevo}'`);
        }
        await renombrarCodigos(userId, batch._id, anterior, nuevo);
        batch.numeroLote = nuevo;
      }

      batch.fungusTypeId = hongoNuevo._id;
    }

    if (parsed.fechaInicio) {
      batch.inoculacionGrano.fechaInicio = parsed.fechaInicio;
    }

    await batch.save();

    return ok(batch);
  } catch (err) {
    return handleApiError(err);
  }
}

// Reemplaza el prefijo `anterior` por `nuevo` en los numeroGuia de los
// frascos y los numeroSeguimiento de los recipientes del lote.
async function renombrarCodigos(
  userId: string,
  batchId: Types.ObjectId,
  anterior: string,
  nuevo: string
) {
  const renombrar = (codigo: string) =>
    codigo.startsWith(`${anterior}-`) ? nuevo + codigo.slice(anterior.length) : codigo;

  const [jars, recipientes] = await Promise.all([
    Jar.find({ userId, batchId }).select("numeroGuia").lean(),
    Recipiente.find({ userId, batchId }).select("numeroSeguimiento").lean(),
  ]);

  await Promise.all([
    jars.length > 0 &&
      Jar.bulkWrite(
        jars.map((j) => ({
          updateOne: {
            filter: { _id: j._id },
            update: { $set: { numeroGuia: renombrar(j.numeroGuia) } },
          },
        }))
      ),
    recipientes.length > 0 &&
      Recipiente.bulkWrite(
        recipientes.map((r) => ({
          updateOne: {
            filter: { _id: r._id },
            update: { $set: { numeroSeguimiento: renombrar(r.numeroSeguimiento) } },
          },
        }))
      ),
  ]);
}
