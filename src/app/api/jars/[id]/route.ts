import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Jar from "@/models/Jar";
import Batch from "@/models/Batch";
import { ok, handleApiError, notFound } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { updateJarStateSchema } from "@/lib/validations/jar.schema";

// Necesario para que el frontend prellene el formulario de "nueva
// clonación" cuando se llega desde "Clonar este frasco": necesita saber el
// hongo (y su diasEsperadosDefault.colonizacionPlacas) y el numeroLote del
// lote de origen para mostrar contexto.
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;

    const jar = await Jar.findOne({ _id: id, userId }).lean();
    if (!jar) throw notFound("Frasco no encontrado");

    const batch = await Batch.findOne({ _id: jar.batchId, userId })
      .select("numeroLote fungusTypeId")
      .populate("fungusTypeId", "nombre diasEsperadosDefault")
      .lean();

    return ok({ ...jar, batch });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = updateJarStateSchema.parse(body);

    const updated = await Jar.findOneAndUpdate(
      { _id: id, userId },
      { $set: { estado: parsed.estado } },
      { new: true, runValidators: true }
    );

    if (!updated) throw notFound("Frasco no encontrado");

    return ok(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
