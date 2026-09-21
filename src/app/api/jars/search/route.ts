import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Jar from "@/models/Jar";
import Batch from "@/models/Batch";
import { ok, fail, handleApiError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/jars/search?numeroGuia=L-2026-003-F01
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const numeroGuia = searchParams.get("numeroGuia");

    if (!numeroGuia) {
      return fail("El parametro numeroGuia es requerido", 400);
    }

    const regex = new RegExp(`^${escapeRegExp(numeroGuia.trim())}$`, "i");
    const jar = await Jar.findOne({ userId, numeroGuia: regex }).lean();

    if (!jar) {
      return fail(`No se encontro ningun frasco con numeroGuia '${numeroGuia}'`, 404);
    }

    const batch = await Batch.findOne({ _id: jar.batchId, userId })
      .select("numeroLote fungusTypeId")
      .populate("fungusTypeId")
      .lean();

    return ok({ ...jar, batch });
  } catch (err) {
    return handleApiError(err);
  }
}
