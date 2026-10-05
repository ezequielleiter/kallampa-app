import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Cliente from "@/models/Cliente";
import { ok, handleApiError, conflict } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { createClienteSchema } from "@/lib/validations/cliente.schema";
import { conAgregados } from "@/lib/clientes-server";

const CLIENTE_NOMBRE_EN_USO = "cliente_nombre_en_uso:Ya existe un cliente con ese nombre";

// GET: lista de clientes con sus agregados de compras, por nombre.
// ?activos=1 devuelve solo los activos.
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const activos = searchParams.get("activos");

    const filter: Record<string, unknown> = { userId };
    if (activos === "1" || activos === "true") filter.activo = true;

    const clientes = await Cliente.find(filter).sort({ nombre: 1 }).lean();
    return ok(await conAgregados(userId, clientes));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const parsed = createClienteSchema.parse(await req.json());

    if (await Cliente.exists({ userId, nombre: parsed.nombre })) {
      throw conflict(CLIENTE_NOMBRE_EN_USO);
    }

    const datos = Object.fromEntries(Object.entries(parsed).filter(([, v]) => v != null));
    const created = await Cliente.create({ ...datos, userId });
    return ok({ ...created.toObject(), totalComprado: 0, cantidadVentas: 0, saldoPendiente: 0 }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
