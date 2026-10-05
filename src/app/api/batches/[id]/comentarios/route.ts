import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import { ok, handleApiError, notFound } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { comentarioSchema } from "@/lib/validations/batch.schema";

// Agrega un comentario al hilo del lote. Devuelve el hilo completo.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = comentarioSchema.parse(body);

    const batch = await Batch.findOne({ _id: id, userId });
    if (!batch) throw notFound("lote_no_encontrado:Lote no encontrado");

    batch.comentarios.push({ texto: parsed.texto });

    await batch.save();

    return ok(batch.comentarios, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
