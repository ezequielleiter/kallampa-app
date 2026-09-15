import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Recipiente from "@/models/Recipiente";
import Batch from "@/models/Batch";
import { ok, handleApiError, notFound } from "@/lib/api-utils";

// Necesario para que el frontend prellene el formulario de "nueva
// clonación" cuando se llega desde "Clonar este recipiente": necesita saber
// el hongo (y su diasEsperadosDefault.colonizacionPlacas) y el numeroLote
// del lote de origen para mostrar contexto.
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await ctx.params;

    const recipiente = await Recipiente.findById(id).lean();
    if (!recipiente) throw notFound("Recipiente no encontrado");

    const batch = await Batch.findById(recipiente.batchId)
      .select("numeroLote fungusTypeId")
      .populate("fungusTypeId", "nombre diasEsperadosDefault")
      .lean();

    return ok({ ...recipiente, batch });
  } catch (err) {
    return handleApiError(err);
  }
}
