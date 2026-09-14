import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Recipiente from "@/models/Recipiente";
import { ok, handleApiError, notFound } from "@/lib/api-utils";
import { updateOleadaSchema } from "@/lib/validations/recipiente.schema";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; oleadaId: string }> }
) {
  try {
    await dbConnect();
    const { id, oleadaId } = await ctx.params;
    const body = await req.json();
    const parsed = updateOleadaSchema.parse(body);

    const recipiente = await Recipiente.findById(id);
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
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; oleadaId: string }> }
) {
  try {
    await dbConnect();
    const { id, oleadaId } = await ctx.params;

    const recipiente = await Recipiente.findById(id);
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
