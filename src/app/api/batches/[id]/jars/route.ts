import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import Jar from "@/models/Jar";
import { ok, handleApiError, notFound } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { addJarsSchema } from "@/lib/validations/jar.schema";

const SUFIJO_FRASCO = /-F(\d+)$/;

// POST /api/batches/[id]/jars { cantidad }
// Agrega frascos a un lote ya creado. La numeracion sigue desde el sufijo
// -F<n> mas alto existente, asi un hueco dejado por un frasco borrado no se
// rellena (los demas pueden estar ya rotulados fisicamente). Si se borro el
// ultimo, su numero si vuelve a usarse: ese frasco ya no existe.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = addJarsSchema.parse(body);

    const batch = await Batch.findOne({ _id: id, userId }).lean();
    if (!batch) throw notFound("lote_no_encontrado:Lote no encontrado");

    const existentes = await Jar.find({ batchId: id, userId }).select("numeroGuia").lean();
    const maxNumero = existentes.reduce((max, jar) => {
      const match = SUFIJO_FRASCO.exec(jar.numeroGuia);
      return match ? Math.max(max, Number(match[1])) : max;
    }, existentes.length);

    const jars = await Jar.insertMany(
      Array.from({ length: parsed.cantidad }, (_, i) => ({
        userId,
        batchId: batch._id,
        numeroGuia: `${batch.numeroLote}-F${String(maxNumero + i + 1).padStart(2, "0")}`,
      }))
    );

    await Batch.updateOne(
      { _id: batch._id, userId },
      { $inc: { "inoculacionGrano.cantidadFrascos": parsed.cantidad } }
    );

    return ok(jars, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
