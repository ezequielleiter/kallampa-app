import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Recipiente from "@/models/Recipiente";
import { ok, handleApiError, notFound, conflict } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { addOleadaSchema } from "@/lib/validations/recipiente.schema";

// Agrega una oleada al recipiente. Requiere estado === 'fructificando'.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = addOleadaSchema.parse(body);

    const recipiente = await Recipiente.findOne({ _id: id, userId });
    if (!recipiente) throw notFound("Recipiente no encontrado");

    if (recipiente.estado !== "fructificando") {
      throw conflict(
        `Solo se pueden agregar oleadas cuando el recipiente esta en estado 'fructificando' (estado actual: '${recipiente.estado}')`
      );
    }

    recipiente.oleadas.push({
      fecha: parsed.fecha,
      pesoKg: parsed.pesoKg,
      notas: parsed.notas,
    });

    await recipiente.save();

    return ok(recipiente, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
