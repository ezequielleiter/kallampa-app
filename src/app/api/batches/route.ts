import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import Jar from "@/models/Jar";
import FungusType from "@/models/FungusType";
import { ok, fail, handleApiError, badRequest } from "@/lib/api-utils";
import { createBatchSchema } from "@/lib/validations/batch.schema";
import { getNextNumeroLote } from "@/lib/counters";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado");
    const fungusTypeId = searchParams.get("fungusTypeId");

    const filter: Record<string, unknown> = {};
    if (estado) filter.estado = estado;
    if (fungusTypeId) filter.fungusTypeId = fungusTypeId;

    const batches = await Batch.find(filter)
      .populate("fungusTypeId")
      .sort({ createdAt: -1 })
      .lean();

    return ok(batches);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const parsed = createBatchSchema.parse(body);

    const fungusType = await FungusType.findById(parsed.fungusTypeId).lean();
    if (!fungusType) {
      return fail("El tipo de hongo indicado no existe", 400);
    }

    const diasEsperados =
      parsed.diasEsperados ?? fungusType.diasEsperadosDefault.inoculacionGrano;

    if (!diasEsperados) {
      throw badRequest(
        "No se pudo determinar diasEsperados para inoculacion de grano"
      );
    }

    // Armamos y validamos todo en memoria antes de persistir nada: si algo
    // de esto fallara, no queremos un Batch huerfano sin sus Jars.
    const numeroLote = await getNextNumeroLote(parsed.fechaInicio);

    const jarsToCreate = Array.from(
      { length: parsed.cantidadFrascos },
      (_, i) => ({
        numeroGuia: `${numeroLote}-F${String(i + 1).padStart(2, "0")}`,
      })
    );

    const batch = await Batch.create({
      numeroLote,
      fungusTypeId: parsed.fungusTypeId,
      estado: "inoculacion_grano",
      descartado: false,
      inoculacionGrano: {
        tipoGranoId: parsed.tipoGranoId,
        pesoGranoKg: parsed.pesoGranoKg,
        precioPorKg: parsed.precioPorKg,
        cantidadFrascos: parsed.cantidadFrascos,
        fechaInicio: parsed.fechaInicio,
        diasEsperados,
      },
      oleadas: [],
      historialEstados: [
        { estado: "inoculacion_grano", fecha: parsed.fechaInicio },
      ],
    });

    // El Batch ya esta persistido (tiene numeroLote unico reservado via
    // Counter). Si la insercion de Jars fallara a mitad de camino no hacemos
    // rollback complejo: es una app de un solo operador, y el lote queda
    // identificable/corregible a mano si hiciera falta (ver README interno).
    let jars;
    try {
      jars = await Jar.insertMany(
        jarsToCreate.map((j) => ({ ...j, batchId: batch._id }))
      );
    } catch (jarErr) {
      return handleApiError(jarErr);
    }

    return ok({ ...batch.toObject(), jars }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
