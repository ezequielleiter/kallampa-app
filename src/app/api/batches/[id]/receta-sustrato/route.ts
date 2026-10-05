import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import { ok, handleApiError, notFound } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { recetaSustratoSchema } from "@/lib/validations/batch.schema";

// Guarda (o reemplaza) la receta de sustrato del lote. Devuelve la receta.
export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = recetaSustratoSchema.parse(body);

    const batch = await Batch.findOne({ _id: id, userId });
    if (!batch) throw notFound("lote_no_encontrado:Lote no encontrado");

    batch.set("recetaSustrato", parsed);
    await batch.save();

    return ok(batch.recetaSustrato ?? null);
  } catch (err) {
    return handleApiError(err);
  }
}

// Quita la receta de sustrato del lote.
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;

    const batch = await Batch.findOne({ _id: id, userId });
    if (!batch) throw notFound("lote_no_encontrado:Lote no encontrado");

    batch.set("recetaSustrato", undefined);
    await batch.save();

    return ok(null);
  } catch (err) {
    return handleApiError(err);
  }
}
