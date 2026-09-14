import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import Jar from "@/models/Jar";
import Recipiente from "@/models/Recipiente";
import FungusType from "@/models/FungusType";
import { ok, fail, handleApiError, badRequest } from "@/lib/api-utils";
import { createRecipienteSchema } from "@/lib/validations/recipiente.schema";

// GET /api/recipientes?batchId=
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");

    const filter: Record<string, unknown> = {};
    if (batchId) filter.batchId = batchId;

    const recipientes = await Recipiente.find(filter)
      .populate("tipoSustratoId")
      .sort({ numeroSeguimiento: 1 })
      .lean();

    return ok(recipientes);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const parsed = createRecipienteSchema.parse(body);

    const batch = await Batch.findById(parsed.batchId).lean();
    if (!batch) {
      return fail("El lote indicado no existe", 400);
    }

    // Los frascos de origen tienen que (a) pertenecer al batch indicado y
    // (b) estar listos: 'colonizado' (nunca usado) o 'usado' (ya se uso en
    // otro recipiente, pero SE PUEDE volver a elegir: en la practica el
    // grano de un mismo frasco a veces se reparte en mas de un recipiente).
    // No son validos: 'colonizando' (todavia no esta listo) ni
    // 'contaminado' (perdida).
    const frascos = await Jar.find({ _id: { $in: parsed.origenFrascoIds } }).lean();

    if (frascos.length !== parsed.origenFrascoIds.length) {
      return fail("Alguno de los frascos de origen no existe", 400);
    }

    const frascoDeOtroLote = frascos.find((f) => String(f.batchId) !== String(parsed.batchId));
    if (frascoDeOtroLote) {
      return fail(
        `El frasco '${frascoDeOtroLote.numeroGuia}' no pertenece al lote indicado`,
        400
      );
    }

    const frascoNoDisponible = frascos.find(
      (f) => f.estado !== "colonizado" && f.estado !== "usado"
    );
    if (frascoNoDisponible) {
      return fail(
        `El frasco '${frascoNoDisponible.numeroGuia}' no esta disponible como origen (estado actual: '${frascoNoDisponible.estado}')`,
        409
      );
    }

    const fungusType = await FungusType.findById(batch.fungusTypeId).lean();
    if (!fungusType) {
      throw badRequest("El tipo de hongo del lote ya no existe");
    }

    const diasEsperadosIncubacion =
      parsed.diasEsperadosIncubacion ?? fungusType.diasEsperadosDefault.incubacion;

    // Correlativo por lote (no global): cuenta cuantos recipientes ya tiene
    // este batchId. No hace falta atomicidad de Counter aca (app de un solo
    // operador, los recipientes de un lote se crean en momentos distintos).
    const cantidadExistente = await Recipiente.countDocuments({ batchId: parsed.batchId });
    const numeroSeguimiento = `${batch.numeroLote}-R${String(cantidadExistente + 1).padStart(2, "0")}`;

    const recipiente = await Recipiente.create({
      batchId: parsed.batchId,
      numeroSeguimiento,
      origenFrascoIds: parsed.origenFrascoIds,
      tipoSustratoId: parsed.tipoSustratoId,
      pesoSustratoKg: parsed.pesoSustratoKg,
      precioPorKg: parsed.precioPorKg,
      fechaInicioIncubacion: parsed.fechaInicioIncubacion,
      diasEsperadosIncubacion,
      estado: "incubando",
    });

    // Sin transaccion multi-documento (Mongo standalone, igual que en v1):
    // el Recipiente ya quedo persistido; si esto fallara a mitad de camino
    // no hacemos rollback complejo.
    await Jar.updateMany(
      { _id: { $in: parsed.origenFrascoIds } },
      { $set: { estado: "usado" } }
    );

    return ok(recipiente, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
