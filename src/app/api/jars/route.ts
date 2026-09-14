import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Jar from "@/models/Jar";
import { ok, handleApiError } from "@/lib/api-utils";

// GET /api/jars?batchId=&estado=
// Lista frascos de un lote, filtrable por estado. `estado` acepta una lista
// separada por comas (ej. "colonizado,usado") para el selector de "frascos
// de origen" al crear un recipiente: un frasco ya "usado" en un recipiente
// puede volver a elegirse en otro (su grano puede repartirse en más de uno),
// solo se excluyen los que son pérdida (contaminado/descartado).
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");
    const estado = searchParams.get("estado");

    const filter: Record<string, unknown> = {};
    if (batchId) filter.batchId = batchId;
    if (estado) {
      const estados = estado.split(",").map((e) => e.trim()).filter(Boolean);
      filter.estado = estados.length > 1 ? { $in: estados } : estados[0];
    }

    const jars = await Jar.find(filter).sort({ numeroGuia: 1 }).lean();

    return ok(jars);
  } catch (err) {
    return handleApiError(err);
  }
}
