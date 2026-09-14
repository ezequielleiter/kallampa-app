import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import Jar from "@/models/Jar";
import { ok, handleApiError, notFound } from "@/lib/api-utils";
import { updateBatchSchema } from "@/lib/validations/batch.schema";

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
      .populate("crecimientoSustrato.tipoSustratoId")
      .lean();

    if (!batch) throw notFound("Lote no encontrado");

    const jars = await Jar.find({ batchId: id }).sort({ numeroGuia: 1 }).lean();

    return ok({ ...batch, jars });
  } catch (err) {
    return handleApiError(err);
  }
}

// Edicion general de campos sueltos de la etapa actual (ej. ajustar
// diasEsperados) sin disparar una transicion de etapa.
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = updateBatchSchema.parse(body);

    const batch = await Batch.findById(id);
    if (!batch) throw notFound("Lote no encontrado");

    if (parsed.inoculacionGrano) {
      Object.assign(batch.inoculacionGrano, parsed.inoculacionGrano);
    }
    if (parsed.crecimientoSustrato) {
      if (!batch.crecimientoSustrato) {
        batch.crecimientoSustrato = {};
      }
      Object.assign(batch.crecimientoSustrato, parsed.crecimientoSustrato);
    }
    if (parsed.fructificacion) {
      if (!batch.fructificacion) {
        batch.set("fructificacion", { recipientes: [] });
      }
      Object.assign(batch.fructificacion!, parsed.fructificacion);
    }
    if (parsed.cosecha) {
      if (!batch.cosecha) {
        batch.cosecha = {};
      }
      Object.assign(batch.cosecha, parsed.cosecha);
    }

    await batch.save();

    return ok(batch);
  } catch (err) {
    return handleApiError(err);
  }
}
