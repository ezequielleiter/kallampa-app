import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Recipiente, { RECIPIENTE_ESTADOS } from "@/models/Recipiente";
import { ok, handleApiError, notFound, conflict } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { marcarEstadoRecipienteSchema } from "@/lib/validations/recipiente.schema";

const ESTADOS_TERMINALES = new Set<(typeof RECIPIENTE_ESTADOS)[number]>([
  "finalizado",
  "contaminado",
  "descartado",
]);

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = marcarEstadoRecipienteSchema.parse(body);

    const recipiente = await Recipiente.findOne({ _id: id, userId });
    if (!recipiente) throw notFound("Recipiente no encontrado");

    if (ESTADOS_TERMINALES.has(recipiente.estado)) {
      throw conflict(
        `El recipiente ya esta en un estado terminal ('${recipiente.estado}'), no se puede volver a marcar`
      );
    }

    recipiente.estado = parsed.estado;
    if (parsed.motivo) recipiente.motivoPerdida = parsed.motivo;

    await recipiente.save();

    return ok(recipiente);
  } catch (err) {
    return handleApiError(err);
  }
}
