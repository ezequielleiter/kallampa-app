import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tarea from "@/models/Tarea";
import { ok, handleApiError, notFound } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { updateTareaSchema } from "@/lib/validations/tarea.schema";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;

    const tarea = await Tarea.findOne({ _id: id, userId }).lean();
    if (!tarea) throw notFound("tarea_no_encontrada:Tarea no encontrada");

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
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = updateTareaSchema.parse(body);

    const tarea = await Tarea.findOneAndUpdate(
      { _id: id, userId },
      { $set: parsed },
      { new: true, runValidators: true }
    );
    if (!tarea) throw notFound("tarea_no_encontrada:Tarea no encontrada");

    return ok(tarea);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;

    const tarea = await Tarea.findOneAndDelete({ _id: id, userId });
    if (!tarea) throw notFound("tarea_no_encontrada:Tarea no encontrada");

    return ok({ _id: id });
  } catch (err) {
    return handleApiError(err);
  }
}
