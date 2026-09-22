import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import FungusType from "@/models/FungusType";
import { ok, handleApiError, notFound, conflict } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { fungusTypeUpdateSchema } from "@/lib/validations/catalog.schema";

// No hay DELETE fisico: "borrar" del catalogo es PATCH { activo: false }.
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = fungusTypeUpdateSchema.parse(body);

    const current = await FungusType.findOne({ _id: id, userId });
    if (!current) throw notFound("tipo_hongo_no_encontrado:Tipo de hongo no encontrado");

    // Chequeo de unicidad de iniciales entre hongos activos: se evalua sobre
    // el estado *resultante* (iniciales/activo pueden venir omitidos en el
    // PATCH, en cuyo caso se mantiene el valor actual).
    const inicialesFinal = parsed.iniciales !== undefined ? parsed.iniciales : current.iniciales;
    const activoFinal = parsed.activo !== undefined ? parsed.activo : current.activo;

    if (inicialesFinal && activoFinal) {
      const existente = await FungusType.findOne({
        _id: { $ne: id },
        userId,
        iniciales: inicialesFinal,
        activo: true,
      }).lean();
      if (existente) {
        throw conflict(
          `hongo_iniciales_en_uso:Ya existe un hongo activo con las iniciales "${inicialesFinal}" (${existente.nombre})`
        );
      }
    }

    const update: Record<string, unknown> = { ...parsed };
    // Merge parcial de diasEsperadosDefault para no pisar los campos no enviados
    if (parsed.diasEsperadosDefault) {
      delete update.diasEsperadosDefault;
      update.diasEsperadosDefault = {
        ...current.toObject().diasEsperadosDefault,
        ...parsed.diasEsperadosDefault,
      };
    }

    const updated = await FungusType.findOneAndUpdate(
      { _id: id, userId },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!updated) throw notFound("tipo_hongo_no_encontrado:Tipo de hongo no encontrado");

    return ok(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
