import type { NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import dbConnect from "@/lib/mongodb";
import Merma from "@/models/Merma";
import { ok, handleApiError, notFound } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";

const NO_ENCONTRADA = "merma_no_encontrada:Merma no encontrada";

// DELETE fisico: devuelve los kg al stock del lote.
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;
    if (!isValidObjectId(id)) throw notFound(NO_ENCONTRADA);

    const borrada = await Merma.findOneAndDelete({ _id: id, userId });
    if (!borrada) throw notFound(NO_ENCONTRADA);
    return ok(null);
  } catch (err) {
    return handleApiError(err);
  }
}
