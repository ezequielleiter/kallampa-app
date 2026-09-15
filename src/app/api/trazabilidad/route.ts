import type { Types } from "mongoose";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import Jar from "@/models/Jar";
import Recipiente from "@/models/Recipiente";
import Clonacion from "@/models/Clonacion";
import Placa from "@/models/Placa";
import FrascoLiquido from "@/models/FrascoLiquido";
import { ok, handleApiError } from "@/lib/api-utils";
import {
  resumenLote,
  resumenClonacion,
  type LeanBatch,
  type LeanJar,
  type LeanRecipiente,
  type LeanClonacion,
  type LeanPlaca,
  type LeanFrascoLiquido,
} from "@/lib/metrics";

/**
 * GET /api/trazabilidad
 *
 * Sin filtros, trae TODO (volumen chico, app de un solo operador). Da el
 * material crudo para que el frontend reconstruya el arbol completo
 * Lote -> Clonacion -> Lote -> ...: cruzando
 * lote.origenFrascoLiquidoId -> frascoLiquido.clonacionId -> esa Clonacion,
 * y clonacion.origenJarId/origenRecipienteId/origenBatchId -> ese Lote.
 */
export async function GET() {
  try {
    await dbConnect();

    const [batches, clonaciones] = await Promise.all([
      Batch.find({})
        .populate("fungusTypeId", "nombre")
        .sort({ createdAt: -1 })
        .lean() as unknown as Promise<(LeanBatch & { _id: unknown })[]>,
      Clonacion.find({})
        .populate("fungusTypeId", "nombre")
        .populate("origenJarId", "numeroGuia")
        .populate("origenRecipienteId", "numeroSeguimiento")
        .sort({ createdAt: -1 })
        .lean() as unknown as Promise<(LeanClonacion & { _id: unknown })[]>,
    ]);

    const batchIds = batches.map((b) => b._id) as Types.ObjectId[];
    const clonacionIds = clonaciones.map((c) => c._id) as Types.ObjectId[];

    const [jars, recipientes, placas, frascosLiquidos, todosLosFrascosLiquidos] =
      await Promise.all([
        Jar.find({ batchId: { $in: batchIds } }).lean(),
        Recipiente.find({ batchId: { $in: batchIds } }).lean(),
        Placa.find({ clonacionId: { $in: clonacionIds } }).lean(),
        FrascoLiquido.find({ clonacionId: { $in: clonacionIds } }).lean(),
        FrascoLiquido.find({}).select("etiqueta clonacionId").lean(),
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

    const placasByClonacion = new Map<string, LeanPlaca[]>();
    for (const placa of placas as unknown as (LeanPlaca & { clonacionId: unknown })[]) {
      const key = String(placa.clonacionId);
      if (!placasByClonacion.has(key)) placasByClonacion.set(key, []);
      placasByClonacion.get(key)!.push(placa);
    }

    const frascosByClonacion = new Map<string, LeanFrascoLiquido[]>();
    for (const frasco of frascosLiquidos as unknown as (LeanFrascoLiquido & {
      clonacionId: unknown;
    })[]) {
      const key = String(frasco.clonacionId);
      if (!frascosByClonacion.has(key)) frascosByClonacion.set(key, []);
      frascosByClonacion.get(key)!.push(frasco);
    }

    const lotes = batches.map((batch) => {
      const key = String(batch._id);
      const batchJars = jarsByBatch.get(key) ?? [];
      const batchRecipientes = recipientesByBatch.get(key) ?? [];
      const resumen = resumenLote(batch, batchJars, batchRecipientes);

      return {
        _id: batch._id,
        numeroLote: batch.numeroLote,
        fungusTypeId: batch.fungusTypeId,
        origenFrascoLiquidoId: batch.origenFrascoLiquidoId,
        resumen,
      };
    });

    const clonacionesOut = clonaciones.map((clonacion) => {
      const key = String(clonacion._id);
      const clonacionPlacas = placasByClonacion.get(key) ?? [];
      const clonacionFrascos = frascosByClonacion.get(key) ?? [];
      const resumen = resumenClonacion(clonacion, clonacionPlacas, clonacionFrascos);

      const c = clonacion as LeanClonacion & {
        origenTipo?: "jar" | "recipiente";
        origenJarId?: unknown;
        origenRecipienteId?: unknown;
        origenBatchId?: unknown;
      };

      return {
        _id: c._id,
        numeroLote: c.numeroLote,
        fungusTypeId: c.fungusTypeId,
        origenTipo: c.origenTipo,
        origenBatchId: c.origenBatchId,
        origenJarId: c.origenJarId,
        origenRecipienteId: c.origenRecipienteId,
        resumen,
      };
    });

    const frascosLiquidosOut = todosLosFrascosLiquidos.map((f) => ({
      _id: f._id,
      etiqueta: f.etiqueta,
      clonacionId: f.clonacionId,
    }));

    return ok({ lotes, clonaciones: clonacionesOut, frascosLiquidos: frascosLiquidosOut });
  } catch (err) {
    return handleApiError(err);
  }
}
