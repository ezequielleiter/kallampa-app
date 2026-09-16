import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Placa from "@/models/Placa";
import FrascoLiquido from "@/models/FrascoLiquido";
import Clonacion from "@/models/Clonacion";
import { ok, fail, handleApiError, conflict } from "@/lib/api-utils";
import { createFrascoLiquidoSchema } from "@/lib/validations/clonacion.schema";

// GET /api/frascos-liquidos?clonacionId=&estado=
// `clonacionId` es OPCIONAL: sin el, devuelve todos los frascos liquidos del
// sistema (necesario para el selector cross-clonacion al crear un
// recipiente en Produccion). `estado` acepta lista separada por comas,
// mismo patron que /api/jars y /api/placas.
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const clonacionId = searchParams.get("clonacionId");
    const estado = searchParams.get("estado");

    const filter: Record<string, unknown> = {};
    if (clonacionId) filter.clonacionId = clonacionId;
    if (estado) {
      const estados = estado.split(",").map((e) => e.trim()).filter(Boolean);
      filter.estado = estados.length > 1 ? { $in: estados } : estados[0];
    }

    // Se popula tambien el fungusType de la clonacion de origen (nested
    // populate): necesario para que el selector de "iniciar lote desde un
    // frasco liquido" en Produccion pueda mostrar de que hongo es cada uno.
    const frascosLiquidos = await FrascoLiquido.find(filter)
      .populate("origenPlacaId", "numeroPlaca")
      .populate({
        path: "clonacionId",
        select: "numeroLote fungusTypeId",
        populate: { path: "fungusTypeId", select: "nombre diasEsperadosDefault" },
      })
      .sort({ numeroGuia: 1 })
      .lean();

    return ok(frascosLiquidos);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const parsed = createFrascoLiquidoSchema.parse(body);

    const placa = await Placa.findById(parsed.origenPlacaId).lean();
    if (!placa) {
      return fail("La placa de origen indicada no existe", 400);
    }

    if (placa.estado === "contaminado") {
      throw conflict("La placa está contaminada y no se puede usar como origen");
    }

    const clonacionId = placa.clonacionId;

    const clonacion = await Clonacion.findById(clonacionId).lean();
    if (!clonacion) {
      return fail("La clonación de origen ya no existe", 400);
    }

    // Correlativo por clonacion (no global, no atomico): mismo criterio que
    // numeroSeguimiento de Recipiente en POST /api/recipientes.
    const cantidadExistente = await FrascoLiquido.countDocuments({ clonacionId });
    const numeroGuia = `${clonacion.numeroLote}-L${String(cantidadExistente + 1).padStart(2, "0")}`;

    const frascoLiquido = await FrascoLiquido.create({
      clonacionId,
      origenPlacaId: parsed.origenPlacaId,
      numeroGuia,
      fechaCreacion: parsed.fechaCreacion,
      estado: "valido",
    });

    return ok(frascoLiquido, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
