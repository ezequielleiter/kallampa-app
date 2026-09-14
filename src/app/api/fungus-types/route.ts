import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import FungusType from "@/models/FungusType";
import { ok, fail, handleApiError } from "@/lib/api-utils";
import { fungusTypeCreateSchema } from "@/lib/validations/catalog.schema";

// GET: listar. ?activo=true|false filtra; sin querystring devuelve todos
// (la pantalla de catalogo necesita ver los inactivos tambien).
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const activoParam = searchParams.get("activo");

    const filter: Record<string, unknown> = {};
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
    await dbConnect();
    const body = await req.json();
    const parsed = fungusTypeCreateSchema.parse(body);

    const existing = await FungusType.findOne({ nombre: parsed.nombre });
    if (existing) {
      return fail("Ya existe un tipo de hongo con ese nombre", 409);
    }

    const created = await FungusType.create(parsed);
    return ok(created, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
