import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import { ok, handleApiError, notFound } from "@/lib/api-utils";
import { updateFlushSchema } from "@/lib/validations/batch.schema";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; flushId: string }> }
) {
  try {
    await dbConnect();
    const { id, flushId } = await ctx.params;
    const body = await req.json();
    const parsed = updateFlushSchema.parse(body);

    const batch = await Batch.findById(id);
    if (!batch) throw notFound("Lote no encontrado");

    const oleada = batch.oleadas.id(flushId);
    if (!oleada) throw notFound("Oleada no encontrada");

    Object.assign(oleada, parsed);

    await batch.save();

    return ok(batch);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; flushId: string }> }
) {
  try {
    await dbConnect();
    const { id, flushId } = await ctx.params;

    const batch = await Batch.findById(id);
    if (!batch) throw notFound("Lote no encontrado");

    const oleada = batch.oleadas.id(flushId);
    if (!oleada) throw notFound("Oleada no encontrada");

    batch.oleadas.pull({ _id: flushId });

    await batch.save();

    return ok(batch);
  } catch (err) {
    return handleApiError(err);
  }
}
