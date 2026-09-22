import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Nota from "@/models/Nota";
import { ok, handleApiError, notFound } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { updateNotaSchema } from "@/lib/validations/nota.schema";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;

    const nota = await Nota.findOne({ _id: id, userId }).lean();
    if (!nota) throw notFound("nota_no_encontrada:Nota no encontrada");

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
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = updateNotaSchema.parse(body);

    const nota = await Nota.findOneAndUpdate(
      { _id: id, userId },
      { $set: parsed },
      { new: true, runValidators: true }
    );
    if (!nota) throw notFound("nota_no_encontrada:Nota no encontrada");

    return ok(nota);
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

    const nota = await Nota.findOneAndDelete({ _id: id, userId });
    if (!nota) throw notFound("nota_no_encontrada:Nota no encontrada");

    return ok({ _id: id });
  } catch (err) {
    return handleApiError(err);
  }
}
