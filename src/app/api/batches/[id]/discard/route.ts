import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import { ok, handleApiError, notFound, conflict } from "@/lib/api-utils";
import { discardBatchSchema } from "@/lib/validations/batch.schema";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = discardBatchSchema.parse(body);

    const batch = await Batch.findById(id);
    if (!batch) throw notFound("Lote no encontrado");

    if (batch.estado === "finalizado" || batch.estado === "descartado") {
      throw conflict(
        `No se puede descartar un lote en estado '${batch.estado}'`
      );
    }

    const now = new Date();
    batch.descartado = true;
    batch.estado = "descartado";
    batch.motivoDescarte = parsed.motivo;
    batch.historialEstados.push({ estado: "descartado", fecha: now });

    await batch.save();

    return ok(batch);
  } catch (err) {
    return handleApiError(err);
  }
}
