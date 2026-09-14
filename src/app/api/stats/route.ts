import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import { ok, handleApiError } from "@/lib/api-utils";
import {
  resumenLote,
  agregarPorCatalogo,
  type LeanBatch,
} from "@/lib/metrics";

// GET /api/stats?incluirDescartados=true
// Trae todos los batches (por defecto sin los descartados), calcula
// metricas individuales por lote via resumenLote() y agregados por
// catalogo (hongo / grano / sustrato) via agregarPorCatalogo(), mas
// unos KPIs generales. Formato pensado para graficos: arrays de
// {label, value}.
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const incluirDescartados = searchParams.get("incluirDescartados") === "true";

    const filter: Record<string, unknown> = {};
    if (!incluirDescartados) filter.descartado = false;

    const batches = (await Batch.find(filter)
      .populate("fungusTypeId")
      .populate("inoculacionGrano.tipoGranoId")
      .populate("crecimientoSustrato.tipoSustratoId")
      .lean()) as unknown as LeanBatch[];

    const lotes = batches.map((batch) => ({
      _id: (batch as { _id?: unknown })._id,
      numeroLote: batch.numeroLote,
      estado: batch.estado,
      fungusTypeId: batch.fungusTypeId,
      resumen: resumenLote(batch),
    }));

    const agregadosPorHongo = agregarPorCatalogo(batches, "fungusTypeId");
    const agregadosPorGrano = agregarPorCatalogo(batches, "tipoGranoId");
    const agregadosPorSustrato = agregarPorCatalogo(batches, "tipoSustratoId");

    const finalizados = batches.filter((b) => b.estado === "finalizado");
    const activos = batches.filter(
      (b) => b.estado !== "finalizado" && b.estado !== "descartado"
    );
    const descartados = batches.filter((b) => b.estado === "descartado");

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

    const lotesDemorados = lotes.filter((l) => l.resumen.alertaEtapaActual.demorado);

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

    // Distribucion de lotes por estado, forma {label, value} lista para grafico.
    const distribucionPorEstado = [
      "inoculacion_grano",
      "crecimiento_sustrato",
      "fructificacion",
      "cosecha",
      "finalizado",
      "descartado",
    ].map((estado) => ({
      label: estado,
      value: batches.filter((b) => b.estado === estado).length,
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
        estado: l.estado,
        diasDeDemora: l.resumen.alertaEtapaActual.diasDeDemora,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
