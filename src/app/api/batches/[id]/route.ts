import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import Jar from "@/models/Jar";
import Recipiente from "@/models/Recipiente";
import { ok, handleApiError, notFound } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";

// v2: sin PATCH generico -- ya no hay campos sueltos de "etapa actual" a
// nivel batch que editar (el batch es solo el contenedor de trazabilidad).
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;

    const batch = await Batch.findOne({ _id: id, userId })
      .populate("fungusTypeId")
      .populate("inoculacionGrano.tipoGranoId")
      .populate("origenFrascoLiquidoId", "numeroGuia")
      .lean();

    if (!batch) throw notFound("Lote no encontrado");

    const [jars, recipientes] = await Promise.all([
      Jar.find({ batchId: id, userId }).sort({ numeroGuia: 1 }).lean(),
      Recipiente.find({ batchId: id, userId })
        .populate("tipoSustratoId")
        .populate("origenFrascoIds", "numeroGuia")
        .sort({ numeroSeguimiento: 1 })
        .lean(),
    ]);

    return ok({ ...batch, jars, recipientes });
  } catch (err) {
    return handleApiError(err);
  }
}
