import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Jar from "@/models/Jar";
import Batch from "@/models/Batch";
import Recipiente from "@/models/Recipiente";
import Clonacion from "@/models/Clonacion";
import { ok, handleApiError, notFound, conflict } from "@/lib/api-utils";
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
    if (!jar) throw notFound("frasco_no_encontrado:Frasco no encontrado");

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

    if (!updated) throw notFound("frasco_no_encontrado:Frasco no encontrado");

    return ok(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

// Borra un frasco suelto de un lote (por si `cantidadFrascos` se cargo mal
// al crearlo). Los demas frascos no se renumeran. No se permite si el
// frasco ya es origen de un recipiente o de una clonacion: se romperia la
// trazabilidad.
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;

    const jar = await Jar.findOne({ _id: id, userId }).lean();
    if (!jar) throw notFound("frasco_no_encontrado:Frasco no encontrado");

    const [enRecipiente, enClonacion] = await Promise.all([
      Recipiente.exists({ userId, origenFrascoIds: jar._id }),
      Clonacion.exists({ userId, origenJarId: jar._id }),
    ]);
    if (enRecipiente) {
      throw conflict(
        `frasco_usado_en_recipiente:El frasco '${jar.numeroGuia}' ya se usó en un recipiente y no se puede eliminar`
      );
    }
    if (enClonacion) {
      throw conflict(
        `frasco_usado_en_clonacion:El frasco '${jar.numeroGuia}' es origen de una clonación y no se puede eliminar`
      );
    }

    await Jar.deleteOne({ _id: jar._id, userId });
    await Batch.updateOne(
      { _id: jar.batchId, userId },
      { $inc: { "inoculacionGrano.cantidadFrascos": -1 } }
    );

    return ok({ _id: id });
  } catch (err) {
    return handleApiError(err);
  }
}
