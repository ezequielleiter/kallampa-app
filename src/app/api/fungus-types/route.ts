import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import FungusType from "@/models/FungusType";
import { ok, fail, handleApiError, conflict } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { fungusTypeCreateSchema } from "@/lib/validations/catalog.schema";

// GET: listar. ?activo=true|false filtra; sin querystring devuelve todos
// (la pantalla de catalogo necesita ver los inactivos tambien).
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

    const items = await FungusType.find(filter).sort({ nombre: 1 }).lean();
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
    const parsed = fungusTypeCreateSchema.parse(body);

    const existing = await FungusType.findOne({ userId, nombre: parsed.nombre });
    if (existing) {
      return fail("Ya existe un tipo de hongo con ese nombre", 409);
    }

    if (parsed.iniciales) {
      const existente = await FungusType.findOne({
        userId,
        iniciales: parsed.iniciales,
        activo: true,
      }).lean();
      if (existente) {
        throw conflict(`Ya existe un hongo activo con las iniciales "${parsed.iniciales}" (${existente.nombre})`);
      }
    }

    const created = await FungusType.create({ ...parsed, userId });
    return ok(created, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
