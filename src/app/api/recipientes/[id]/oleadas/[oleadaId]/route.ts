import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Recipiente from "@/models/Recipiente";
import { ok, handleApiError, notFound } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { updateOleadaSchema } from "@/lib/validations/recipiente.schema";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; oleadaId: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id, oleadaId } = await ctx.params;
    const body = await req.json();
    const parsed = updateOleadaSchema.parse(body);

    const recipiente = await Recipiente.findOne({ _id: id, userId });
    if (!recipiente) throw notFound("Recipiente no encontrado");

    const oleada = recipiente.oleadas.id(oleadaId);
    if (!oleada) throw notFound("Oleada no encontrada");

    Object.assign(oleada, parsed);

    await recipiente.save();

    return ok(recipiente);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; oleadaId: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id, oleadaId } = await ctx.params;

    const recipiente = await Recipiente.findOne({ _id: id, userId });
    if (!recipiente) throw notFound("Recipiente no encontrado");

    const oleada = recipiente.oleadas.id(oleadaId);
    if (!oleada) throw notFound("Oleada no encontrada");

    recipiente.oleadas.pull({ _id: oleadaId });

    await recipiente.save();

    return ok(recipiente);
  } catch (err) {
    return handleApiError(err);
  }
}
