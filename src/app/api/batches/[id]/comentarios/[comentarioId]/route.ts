import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import { ok, handleApiError, notFound } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { comentarioSchema } from "@/lib/validations/batch.schema";

type Ctx = { params: Promise<{ id: string; comentarioId: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id, comentarioId } = await ctx.params;
    const body = await req.json();
    const parsed = comentarioSchema.parse(body);

    const batch = await Batch.findOne({ _id: id, userId });
    if (!batch) throw notFound("lote_no_encontrado:Lote no encontrado");

    const comentario = batch.comentarios.id(comentarioId);
    if (!comentario) throw notFound("comentario_no_encontrado:Comentario no encontrado");

    comentario.texto = parsed.texto;

    await batch.save();

    return ok(batch.comentarios);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id, comentarioId } = await ctx.params;

    const batch = await Batch.findOne({ _id: id, userId });
    if (!batch) throw notFound("lote_no_encontrado:Lote no encontrado");

    if (!batch.comentarios.id(comentarioId)) {
      throw notFound("comentario_no_encontrado:Comentario no encontrado");
    }

    batch.comentarios.pull({ _id: comentarioId });

    await batch.save();

    return ok(batch.comentarios);
  } catch (err) {
    return handleApiError(err);
  }
}
