import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import { ok, handleApiError, notFound, conflict } from "@/lib/api-utils";
import { addFlushSchema } from "@/lib/validations/batch.schema";

// Agrega una oleada al lote. Requiere estado === 'cosecha'.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = addFlushSchema.parse(body);

    const batch = await Batch.findById(id);
    if (!batch) throw notFound("Lote no encontrado");

    if (batch.estado !== "cosecha") {
      throw conflict(
        `Solo se pueden agregar oleadas cuando el lote esta en etapa 'cosecha' (estado actual: '${batch.estado}')`
      );
    }

    batch.oleadas.push({
      numero: parsed.numero,
      fecha: parsed.fecha,
      pesoKg: parsed.pesoKg,
      notas: parsed.notas,
    });

    await batch.save();

    return ok(batch, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
