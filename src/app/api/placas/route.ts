import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Placa from "@/models/Placa";
import { ok, handleApiError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";

// GET /api/placas?clonacionId=&estado=
// Mismo patron que GET /api/jars: `estado` acepta una lista separada por
// comas (ej. "colonizado,contaminado").
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const clonacionId = searchParams.get("clonacionId");
    const estado = searchParams.get("estado");

    const filter: Record<string, unknown> = { userId };
    if (clonacionId) filter.clonacionId = clonacionId;
    if (estado) {
      const estados = estado.split(",").map((e) => e.trim()).filter(Boolean);
      filter.estado = estados.length > 1 ? { $in: estados } : estados[0];
    }

    const placas = await Placa.find(filter).sort({ numeroPlaca: 1 }).lean();

    return ok(placas);
  } catch (err) {
    return handleApiError(err);
  }
}
