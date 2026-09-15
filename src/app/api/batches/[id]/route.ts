import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import Jar from "@/models/Jar";
import Recipiente from "@/models/Recipiente";
import { ok, handleApiError, notFound } from "@/lib/api-utils";

// v2: sin PATCH generico -- ya no hay campos sueltos de "etapa actual" a
// nivel batch que editar (el batch es solo el contenedor de trazabilidad).
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await ctx.params;

    const batch = await Batch.findById(id)
      .populate("fungusTypeId")
      .populate("inoculacionGrano.tipoGranoId")
      .populate("origenFrascoLiquidoId", "etiqueta")
      .lean();

    if (!batch) throw notFound("Lote no encontrado");

    const [jars, recipientes] = await Promise.all([
      Jar.find({ batchId: id }).sort({ numeroGuia: 1 }).lean(),
      Recipiente.find({ batchId: id })
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
