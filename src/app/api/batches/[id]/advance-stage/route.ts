import type { NextRequest } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import type { BatchEstado } from "@/models/Batch";
import FungusType from "@/models/FungusType";
import { ok, handleApiError, notFound, conflict, badRequest } from "@/lib/api-utils";
import { advanceStageSchema } from "@/lib/validations/batch.schema";

// Orden fijo de transicion. No se pueden saltar etapas.
const STAGE_ORDER: BatchEstado[] = [
  "inoculacion_grano",
  "crecimiento_sustrato",
  "fructificacion",
  "cosecha",
  "finalizado",
];

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = advanceStageSchema.parse(body);

    const batch = await Batch.findById(id);
    if (!batch) throw notFound("Lote no encontrado");

    if (batch.descartado || batch.estado === "descartado") {
      throw conflict("No se puede avanzar de etapa un lote descartado");
    }

    const currentIndex = STAGE_ORDER.indexOf(batch.estado);
    const targetIndex = STAGE_ORDER.indexOf(parsed.targetStage);

    if (targetIndex !== currentIndex + 1) {
      throw conflict(
        `Transicion invalida: no se puede pasar de '${batch.estado}' a '${parsed.targetStage}' (orden esperado: ${STAGE_ORDER.join(" -> ")})`
      );
    }

    const fungusType = await FungusType.findById(batch.fungusTypeId).lean();
    if (!fungusType) {
      throw badRequest("El tipo de hongo del lote ya no existe");
    }

    const now = new Date();

    // Cerrar la etapa actual.
    switch (batch.estado) {
      case "inoculacion_grano":
        batch.inoculacionGrano.fechaFin = now;
        break;
      case "crecimiento_sustrato":
        if (batch.crecimientoSustrato) batch.crecimientoSustrato.fechaFin = now;
        break;
      case "fructificacion":
        if (batch.fructificacion) batch.fructificacion.fechaFin = now;
        break;
      case "cosecha":
        if (batch.cosecha) batch.cosecha.fechaFin = now;
        break;
    }

    // Crear el subdocumento de la etapa destino.
    if (parsed.targetStage === "crecimiento_sustrato") {
      const diasEsperados =
        parsed.diasEsperados ?? fungusType.diasEsperadosDefault.crecimientoSustrato;
      batch.crecimientoSustrato = {
        tipoSustratoId: new Types.ObjectId(parsed.tipoSustratoId),
        kilosSustrato: parsed.kilosSustrato,
        precioPorKg: parsed.precioPorKg,
        fechaInicio: parsed.fechaInicio,
        diasEsperados,
      };
    } else if (parsed.targetStage === "fructificacion") {
      const diasEsperados =
        parsed.diasEsperados ?? fungusType.diasEsperadosDefault.fructificacion;
      batch.set("fructificacion", {
        fechaInicio: parsed.fechaInicio,
        diasEsperados,
        recipientes: parsed.recipientes.map((r) => ({
          codigo: r.codigo,
          pesoKg: r.pesoKg,
          notas: r.notas,
        })),
      });
    } else if (parsed.targetStage === "cosecha") {
      const diasEsperados =
        parsed.diasEsperados ?? fungusType.diasEsperadosDefault.cosecha;
      batch.cosecha = {
        fechaInicio: parsed.fechaInicio,
        diasEsperados,
      };
    } else if (parsed.targetStage === "finalizado") {
      if (!batch.cosecha) {
        throw conflict("El lote no tiene etapa de cosecha iniciada");
      }
      batch.cosecha.fechaFin = now;
    }

    batch.estado = parsed.targetStage;
    batch.historialEstados.push({ estado: parsed.targetStage, fecha: now });

    await batch.save();

    return ok(batch);
  } catch (err) {
    return handleApiError(err);
  }
}
