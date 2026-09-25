import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Invernadero from "@/models/Invernadero";
import { ok, handleApiError, conflict } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { createInvernaderoSchema } from "@/lib/validations/invernadero.schema";

const NOMBRE_EN_USO = "invernadero_nombre_en_uso:Ya existe un invernadero con ese nombre";

// GET: listar. ?activo=true|false filtra; sin querystring devuelve todos
// (la pantalla necesita ver los inactivos tambien).
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const activoParam = searchParams.get("activo");

    const filter: Record<string, unknown> = { userId };
    if (activoParam !== null) {
      filter.activo = activoParam === "true";
    }

    const items = await Invernadero.find(filter).sort({ nombre: 1 }).lean();
    return ok(items);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const body = await req.json();
    const parsed = createInvernaderoSchema.parse(body);

    const existing = await Invernadero.findOne({ userId, nombre: parsed.nombre });
    if (existing) throw conflict(NOMBRE_EN_USO);

    // Los opcionales en null simplemente no se guardan.
    const datos = Object.fromEntries(Object.entries(parsed).filter(([, v]) => v != null));
    const created = await Invernadero.create({ ...datos, userId });
    return ok(created, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

