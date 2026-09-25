import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Invernadero from "@/models/Invernadero";
import { ok, handleApiError, notFound, conflict } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { updateInvernaderoSchema } from "@/lib/validations/invernadero.schema";

const NO_ENCONTRADO = "invernadero_no_encontrado:Invernadero no encontrado";

// Detalle (incluye los dispositivos de monitoreo asociados).
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;

    const invernadero = await Invernadero.findOne({ _id: id, userId }).lean();
    if (!invernadero) throw notFound(NO_ENCONTRADO);

    return ok(invernadero);
  } catch (err) {
    return handleApiError(err);
  }
}

// No hay DELETE fisico: "borrar" es PATCH { activo: false }.
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = updateInvernaderoSchema.parse(body);

    const current = await Invernadero.findOne({ _id: id, userId });
    if (!current) throw notFound(NO_ENCONTRADO);

    if (parsed.nombre !== undefined && parsed.nombre !== current.nombre) {
      const existing = await Invernadero.findOne({
        _id: { $ne: id },
        userId,
        nombre: parsed.nombre,
      });
      if (existing) {
        throw conflict("invernadero_nombre_en_uso:Ya existe un invernadero con ese nombre");
      }
    }

    // `null` borra el campo opcional (precioKwh).
    const $set: Record<string, unknown> = {};
    const $unset: Record<string, 1> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v === null) $unset[k] = 1;
      else if (v !== undefined) $set[k] = v;
    }
    const updated = await Invernadero.findOneAndUpdate(
      { _id: id, userId },
      { $set, ...(Object.keys($unset).length ? { $unset } : {}) },
      { returnDocument: "after", runValidators: true }
    );
    if (!updated) throw notFound(NO_ENCONTRADO);

    return ok(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
