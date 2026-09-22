import type { NextRequest } from "next/server";
import type { Types } from "mongoose";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import Jar from "@/models/Jar";
import Recipiente from "@/models/Recipiente";
import FungusType from "@/models/FungusType";
import FrascoLiquido from "@/models/FrascoLiquido";
import Clonacion from "@/models/Clonacion";
import { ok, fail, handleApiError, badRequest } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { createBatchSchema } from "@/lib/validations/batch.schema";
import { getNextNumeroLote } from "@/lib/counters";
import { resumenLote, type LeanBatch, type LeanJar, type LeanRecipiente } from "@/lib/metrics";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();

    const batches = (await Batch.find({ userId })
      .populate("fungusTypeId")
      .populate("origenFrascoLiquidoId", "numeroGuia")
      .sort({ createdAt: -1 })
      .lean()) as unknown as (LeanBatch & { _id: unknown })[];

    const batchIds = batches.map((b) => b._id) as Types.ObjectId[];

    const [jars, recipientes] = await Promise.all([
      Jar.find({ userId, batchId: { $in: batchIds } }).lean(),
      Recipiente.find({ userId, batchId: { $in: batchIds } }).lean(),
    ]);

    const jarsByBatch = new Map<string, LeanJar[]>();
    for (const jar of jars as unknown as (LeanJar & { batchId: unknown })[]) {
      const key = String(jar.batchId);
      if (!jarsByBatch.has(key)) jarsByBatch.set(key, []);
      jarsByBatch.get(key)!.push(jar);
    }

    const recipientesByBatch = new Map<string, LeanRecipiente[]>();
    for (const rec of recipientes as unknown as (LeanRecipiente & { batchId: unknown })[]) {
      const key = String(rec.batchId);
      if (!recipientesByBatch.has(key)) recipientesByBatch.set(key, []);
      recipientesByBatch.get(key)!.push(rec);
    }

    const data = batches.map((batch) => {
      const key = String(batch._id);
      const batchJars = jarsByBatch.get(key) ?? [];
      const batchRecipientes = recipientesByBatch.get(key) ?? [];
      const resumen = resumenLote(batch, batchJars, batchRecipientes);

      return {
        _id: batch._id,
        numeroLote: batch.numeroLote,
        fungusTypeId: batch.fungusTypeId,
        origenFrascoLiquidoId: batch.origenFrascoLiquidoId,
        inoculacionGrano: batch.inoculacionGrano,
        estadoDerivado: resumen.estadoDerivado,
        alertas: resumen.alertas,
      };
    });

    return ok(data);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const body = await req.json();
    const parsed = createBatchSchema.parse(body);

    let fungusTypeId = parsed.fungusTypeId;
    let origenFrascoLiquidoId: string | undefined;

    if (parsed.origenFrascoLiquidoId) {
      const frascoLiquido = await FrascoLiquido.findOne({
        _id: parsed.origenFrascoLiquidoId,
        userId,
      }).lean();
      if (!frascoLiquido) {
        return fail(
          "frasco_liquido_origen_no_existe:El frasco de micelio líquido indicado no existe",
          400
        );
      }
      if (frascoLiquido.estado !== "valido") {
        return fail(
          `frasco_liquido_no_disponible:El frasco de micelio líquido '${frascoLiquido.numeroGuia}' no está disponible (estado actual: '${frascoLiquido.estado}')`,
          409
        );
      }
      const clonacion = await Clonacion.findOne({ _id: frascoLiquido.clonacionId, userId }).lean();
      if (!clonacion) {
        return fail(
          "clonacion_origen_frasco_no_existe:La clonación de origen del frasco ya no existe",
          400
        );
      }
      fungusTypeId = String(clonacion.fungusTypeId);
      origenFrascoLiquidoId = parsed.origenFrascoLiquidoId;
    }

    const fungusType = await FungusType.findOne({ _id: fungusTypeId, userId }).lean();
    if (!fungusType) {
      return fail("tipo_hongo_no_existe:El tipo de hongo indicado no existe", 400);
    }

    const diasEsperados =
      parsed.diasEsperados ?? fungusType.diasEsperadosDefault.inoculacionGrano;

    if (!diasEsperados) {
      throw badRequest(
        "dias_esperados_indeterminados_inoculacion:No se pudo determinar diasEsperados para inoculacion de grano"
      );
    }

    // Armamos y validamos todo en memoria antes de persistir nada: si algo
    // de esto fallara, no queremos un Batch huerfano sin sus Jars.
    const numeroLoteBase = await getNextNumeroLote(userId, parsed.fechaInicio);
    const numeroLote = fungusType.iniciales ? `${fungusType.iniciales}-${numeroLoteBase}` : numeroLoteBase;

    const jarsToCreate = Array.from(
      { length: parsed.cantidadFrascos },
      (_, i) => ({
        numeroGuia: `${numeroLote}-F${String(i + 1).padStart(2, "0")}`,
      })
    );

    const batch = await Batch.create({
      userId,
      numeroLote,
      fungusTypeId,
      ...(origenFrascoLiquidoId ? { origenFrascoLiquidoId } : {}),
      inoculacionGrano: {
        tipoGranoId: parsed.tipoGranoId,
        pesoGranoKg: parsed.pesoGranoKg,
        precioPorKg: parsed.precioPorKg,
        cantidadFrascos: parsed.cantidadFrascos,
        fechaInicio: parsed.fechaInicio,
        diasEsperados,
      },
    });

    // El Batch ya esta persistido (tiene numeroLote unico reservado via
    // Counter). Si la insercion de Jars fallara a mitad de camino no hacemos
    // rollback complejo: es una app de un solo operador, y el lote queda
    // identificable/corregible a mano si hiciera falta.
    let jars;
    try {
      jars = await Jar.insertMany(
        jarsToCreate.map((j) => ({ ...j, batchId: batch._id, userId }))
      );
    } catch (jarErr) {
      return handleApiError(jarErr);
    }

    return ok({ ...batch.toObject(), jars }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
