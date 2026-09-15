import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Nota from "@/models/Nota";
import { ok, handleApiError, notFound } from "@/lib/api-utils";
import { updateNotaSchema } from "@/lib/validations/nota.schema";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await ctx.params;

    const nota = await Nota.findById(id).lean();
    if (!nota) throw notFound("Nota no encontrada");

    return ok(nota);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = updateNotaSchema.parse(body);

    const nota = await Nota.findByIdAndUpdate(id, { $set: parsed }, { new: true, runValidators: true });
    if (!nota) throw notFound("Nota no encontrada");

    return ok(nota);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await ctx.params;

    const nota = await Nota.findByIdAndDelete(id);
    if (!nota) throw notFound("Nota no encontrada");

    return ok({ _id: id });
  } catch (err) {
    return handleApiError(err);
  }
}
