import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import FungusType from "@/models/FungusType";
import { ok, handleApiError, notFound } from "@/lib/api-utils";
import { fungusTypeUpdateSchema } from "@/lib/validations/catalog.schema";

// No hay DELETE fisico: "borrar" del catalogo es PATCH { activo: false }.
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = fungusTypeUpdateSchema.parse(body);

    const update: Record<string, unknown> = { ...parsed };
    // Merge parcial de diasEsperadosDefault para no pisar los campos no enviados
    if (parsed.diasEsperadosDefault) {
      delete update.diasEsperadosDefault;
      const existing = await FungusType.findById(id).lean();
      if (!existing) throw notFound("Tipo de hongo no encontrado");
      update.diasEsperadosDefault = {
        ...existing.diasEsperadosDefault,
        ...parsed.diasEsperadosDefault,
      };
    }

    const updated = await FungusType.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!updated) throw notFound("Tipo de hongo no encontrado");

    return ok(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
