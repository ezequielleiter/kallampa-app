import type { NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import dbConnect from "@/lib/mongodb";
import Cliente from "@/models/Cliente";
import { ok, handleApiError, notFound, conflict } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { updateClienteSchema } from "@/lib/validations/cliente.schema";
import { conAgregados } from "@/lib/clientes-server";
import { CLIENTE_NO_ENCONTRADO } from "@/lib/ventas-server";

const NOMBRE_EN_USO = "cliente_nombre_en_uso:Ya existe un cliente con ese nombre";

// No hay DELETE: "borrar" es PATCH { activo: false } (las ventas lo siguen
// referenciando).
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;
    const parsed = updateClienteSchema.parse(await req.json());

    if (!isValidObjectId(id)) throw notFound(CLIENTE_NO_ENCONTRADO);
    const current = await Cliente.findOne({ _id: id, userId });
    if (!current) throw notFound(CLIENTE_NO_ENCONTRADO);

    if (parsed.nombre !== undefined && parsed.nombre !== current.nombre) {
      if (await Cliente.exists({ _id: { $ne: id }, userId, nombre: parsed.nombre })) {
        throw conflict(NOMBRE_EN_USO);
      }
    }

    // `null` borra el campo opcional (contacto/notas).
    const $set: Record<string, unknown> = {};
    const $unset: Record<string, 1> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v === null) $unset[k] = 1;
      else if (v !== undefined) $set[k] = v;
    }
    const updated = await Cliente.findOneAndUpdate(
      { _id: id, userId },
      { $set, ...(Object.keys($unset).length ? { $unset } : {}) },
      { returnDocument: "after", runValidators: true }
    ).lean();
    if (!updated) throw notFound(CLIENTE_NO_ENCONTRADO);

    const [conAgr] = await conAgregados(userId, [updated]);
    return ok(conAgr);
  } catch (err) {
    return handleApiError(err);
  }
}
