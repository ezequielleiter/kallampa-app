import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import Recipiente from "@/models/Recipiente";
import FungusType from "@/models/FungusType";
import { ok, handleApiError, notFound, conflict, badRequest } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { fructificarRecipienteSchema } from "@/lib/validations/recipiente.schema";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = fructificarRecipienteSchema.parse(body);

    const recipiente = await Recipiente.findOne({ _id: id, userId });
    if (!recipiente) throw notFound("Recipiente no encontrado");

    if (recipiente.estado !== "incubando") {
      throw conflict(
        `Solo se puede pasar a fructificacion un recipiente en estado 'incubando' (estado actual: '${recipiente.estado}')`
      );
    }

    let diasEsperadosFructificacion = parsed.diasEsperadosFructificacion;
    if (diasEsperadosFructificacion === undefined) {
      const batch = await Batch.findOne({ _id: recipiente.batchId, userId }).lean();
      if (!batch) throw badRequest("El lote del recipiente ya no existe");
      const fungusType = await FungusType.findOne({ _id: batch.fungusTypeId, userId }).lean();
      if (!fungusType) throw badRequest("El tipo de hongo del lote ya no existe");
      diasEsperadosFructificacion = fungusType.diasEsperadosDefault.fructificacion;
    }

    recipiente.fechaInicioFructificacion = parsed.fechaInicioFructificacion;
    recipiente.diasEsperadosFructificacion = diasEsperadosFructificacion;
    recipiente.estado = "fructificando";

    await recipiente.save();

    return ok(recipiente);
  } catch (err) {
    return handleApiError(err);
  }
}
