import type { NextRequest } from "next/server";
import type { Types } from "mongoose";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import Jar from "@/models/Jar";
import Recipiente, { RECIPIENTE_ESTADOS } from "@/models/Recipiente";
import { ok, handleApiError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import {
  resumenLote,
  agregarPorCatalogo,
  type LeanBatch,
  type LeanJar,
  type LeanRecipiente,
  type LoteConDatos,
} from "@/lib/metrics";

// GET /api/stats
// Trae todos los batches + sus jars/recipientes (por batchId), calcula
// metricas individuales por lote via resumenLote() y agregados por
// catalogo (hongo / grano / sustrato) via agregarPorCatalogo(), mas
// unos KPIs generales. Formato pensado para graficos: arrays de
// {label, value}.
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();

    const batches = (await Batch.find({ userId })
      .populate("fungusTypeId")
      .populate("inoculacionGrano.tipoGranoId")
      .lean()) as unknown as (LeanBatch & { _id: unknown })[];

    const batchIds = batches.map((b) => b._id) as Types.ObjectId[];

    const [jars, recipientes] = await Promise.all([
      Jar.find({ userId, batchId: { $in: batchIds } }).lean(),
      Recipiente.find({ userId, batchId: { $in: batchIds } })
        .populate("tipoSustratoId")
        .lean(),
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

    const lotesConDatos: LoteConDatos[] = batches.map((batch) => ({
      batch,
      frascos: jarsByBatch.get(String(batch._id)) ?? [],
      recipientes: recipientesByBatch.get(String(batch._id)) ?? [],
    }));

    const lotes = lotesConDatos.map(({ batch, frascos, recipientes: recs }) => ({
      _id: batch._id,
      numeroLote: batch.numeroLote,
      fungusTypeId: batch.fungusTypeId,
      resumen: resumenLote(batch, frascos, recs),
    }));

    const agregadosPorHongo = agregarPorCatalogo("fungusTypeId", lotesConDatos, []);
    const agregadosPorGrano = agregarPorCatalogo("tipoGranoId", lotesConDatos, []);
    const agregadosPorSustrato = agregarPorCatalogo(
      "tipoSustratoId",
      [],
      recipientes as unknown as LeanRecipiente[]
    );

    const activos = lotes.filter((l) => l.resumen.estadoDerivado === "en_progreso");
    const finalizados = lotes.filter((l) => l.resumen.estadoDerivado === "finalizado");

    // v2: un Batch ya no se puede "descartar" como un todo (eso se hace por
    // recipiente). Interpretamos "lote descartado" como el caso limite mas
    // cercano: un lote finalizado en el que TODOS sus recipientes terminaron
    // perdidos (contaminado/descartado) y ninguno llego a producir nada.
    const descartados = lotesConDatos.filter(({ recipientes: recs }) => {
      if (recs.length === 0) return false;
      return recs.every((r) => r.estado === "contaminado" || r.estado === "descartado");
    });

    const eficiencias = lotes
      .map((l) => l.resumen.eficienciaBiologica)
      .filter((v): v is number => v !== null);
    const costosPorKg = lotes
      .map((l) => l.resumen.costoProduccion.costoPorKgProducido)
      .filter((v): v is number => v !== null);
    const pesoTotalProducido = lotes.reduce(
      (acc, l) => acc + l.resumen.pesoTotalCosechado,
      0
    );

    const lotesDemorados = lotes.filter((l) => l.resumen.alertas > 0);

    const kpis = {
      totalLotes: batches.length,
      lotesActivos: activos.length,
      lotesFinalizados: finalizados.length,
      lotesDescartados: descartados.length,
      lotesDemorados: lotesDemorados.length,
      pesoTotalProducidoKg: pesoTotalProducido,
      eficienciaBiologicaPromedio:
        eficiencias.length > 0
          ? eficiencias.reduce((a, b) => a + b, 0) / eficiencias.length
          : null,
      costoPorKgPromedio:
        costosPorKg.length > 0
          ? costosPorKg.reduce((a, b) => a + b, 0) / costosPorKg.length
          : null,
    };

    // v2: el batch ya no tiene un "estado" propio (ver estadoLote() en
    // metrics.ts), asi que la distribucion "por estado" con 2 valores
    // (en_progreso/finalizado) es poco informativa por si sola. En vez de
    // eso mostramos la distribucion de los RECIPIENTES por su propio
    // estado (incubando/fructificando/finalizado/contaminado/descartado),
    // que refleja mejor donde esta "la carga de trabajo" real del cultivo
    // en un momento dado.
    const distribucionPorEstado = RECIPIENTE_ESTADOS.map((estado) => ({
      label: estado,
      value: (recipientes as unknown as LeanRecipiente[]).filter((r) => r.estado === estado)
        .length,
    }));

    return ok({
      kpis,
      lotes,
      distribucionPorEstado,
      agregados: {
        porHongo: agregadosPorHongo,
        porGrano: agregadosPorGrano,
        porSustrato: agregadosPorSustrato,
      },
      lotesDemorados: lotesDemorados.map((l) => ({
        numeroLote: l.numeroLote,
        diasDeDemora: l.resumen.diasDeDemora,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
