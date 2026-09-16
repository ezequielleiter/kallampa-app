import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Clonacion from "@/models/Clonacion";
import Placa from "@/models/Placa";
import FrascoLiquido from "@/models/FrascoLiquido";
import { ok, handleApiError, notFound } from "@/lib/api-utils";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await ctx.params;

    const clonacion = await Clonacion.findById(id)
      .populate("fungusTypeId")
      .populate("origenJarId", "numeroGuia")
      .populate("origenRecipienteId", "numeroSeguimiento")
      .populate("origenBatchId", "numeroLote")
      .lean();

    if (!clonacion) throw notFound("Clonación no encontrada");

    const [placas, frascosLiquidos] = await Promise.all([
      Placa.find({ clonacionId: id }).sort({ numeroPlaca: 1 }).lean(),
      FrascoLiquido.find({ clonacionId: id })
        .populate("origenPlacaId", "numeroPlaca")
        .sort({ numeroGuia: 1 })
        .lean(),
    ]);

    return ok({ ...clonacion, placas, frascosLiquidos });
  } catch (err) {
    return handleApiError(err);
  }
}
