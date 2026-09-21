import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tarea from "@/models/Tarea";
import { ok, handleApiError, notFound } from "@/lib/api-utils";
import { updateTareaSchema } from "@/lib/validations/tarea.schema";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await ctx.params;

    const tarea = await Tarea.findById(id).lean();
    if (!tarea) throw notFound("Tarea no encontrada");

    return ok(tarea);
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
    const parsed = updateTareaSchema.parse(body);

    const tarea = await Tarea.findByIdAndUpdate(id, { $set: parsed }, { new: true, runValidators: true });
    if (!tarea) throw notFound("Tarea no encontrada");

    return ok(tarea);
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

    const tarea = await Tarea.findByIdAndDelete(id);
    if (!tarea) throw notFound("Tarea no encontrada");

    return ok({ _id: id });
  } catch (err) {
    return handleApiError(err);
  }
}
