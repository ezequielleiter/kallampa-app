import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Clonacion from "@/models/Clonacion";
import Placa from "@/models/Placa";
import FrascoLiquido from "@/models/FrascoLiquido";
import { ok, handleApiError, notFound } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;

    const clonacion = await Clonacion.findOne({ _id: id, userId })
      .populate("fungusTypeId")
      .populate("origenJarId", "numeroGuia")
      .populate("origenRecipienteId", "numeroSeguimiento")
      .populate("origenBatchId", "numeroLote")
      .lean();

    if (!clonacion) throw notFound("clonacion_no_encontrada:Clonación no encontrada");

    const [placas, frascosLiquidos] = await Promise.all([
      Placa.find({ clonacionId: id, userId }).sort({ numeroPlaca: 1 }).lean(),
      FrascoLiquido.find({ clonacionId: id, userId })
        .populate("origenPlacaId", "numeroPlaca")
        .sort({ numeroGuia: 1 })
        .lean(),
    ]);

    return ok({ ...clonacion, placas, frascosLiquidos });
  } catch (err) {
    return handleApiError(err);
  }
}
