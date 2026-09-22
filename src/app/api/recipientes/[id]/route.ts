import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Recipiente from "@/models/Recipiente";
import Batch from "@/models/Batch";
import { ok, handleApiError, notFound } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";

// Necesario para que el frontend prellene el formulario de "nueva
// clonación" cuando se llega desde "Clonar este recipiente": necesita saber
// el hongo (y su diasEsperadosDefault.colonizacionPlacas) y el numeroLote
// del lote de origen para mostrar contexto.
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;

    const recipiente = await Recipiente.findOne({ _id: id, userId }).lean();
    if (!recipiente) throw notFound("recipiente_no_encontrado:Recipiente no encontrado");

    const batch = await Batch.findOne({ _id: recipiente.batchId, userId })
      .select("numeroLote fungusTypeId")
      .populate("fungusTypeId", "nombre diasEsperadosDefault")
      .lean();

    return ok({ ...recipiente, batch });
  } catch (err) {
    return handleApiError(err);
  }
}
