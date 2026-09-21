import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import FrascoLiquido from "@/models/FrascoLiquido";
import { ok, handleApiError, notFound } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { updateFrascoLiquidoEstadoSchema } from "@/lib/validations/clonacion.schema";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = updateFrascoLiquidoEstadoSchema.parse(body);

    const updated = await FrascoLiquido.findOneAndUpdate(
      { _id: id, userId },
      { $set: { estado: parsed.estado } },
      { new: true, runValidators: true }
    );

    if (!updated) throw notFound("Frasco líquido no encontrado");

    return ok(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
