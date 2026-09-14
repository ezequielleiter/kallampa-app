"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCards } from "@/components/stats/KpiCards";
import { EstadoDistributionChart } from "@/components/stats/EstadoDistributionChart";
import { AgregadoComparisonChart } from "@/components/stats/AgregadoComparisonChart";
import { LotesDemoradosPanel } from "@/components/stats/LotesDemoradosPanel";
import { LoteSelector } from "@/components/stats/LoteSelector";
import { LoteComparisonTable } from "@/components/stats/LoteComparisonTable";
import { apiFetch } from "@/lib/api-client";
import { CHART_PALETTE } from "@/lib/constants";
import type { AgregadoCatalogo } from "@/lib/metrics";
import type { StatsResponse } from "@/lib/types";

export default function EstadisticasPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLoteIds, setSelectedLoteIds] = useState<string[]>([]);

  const selectedLotes = useMemo(
    () => (stats ? stats.lotes.filter((l) => selectedLoteIds.includes(l._id)) : []),
    [stats, selectedLoteIds]
  );

  const comparisonData: AgregadoCatalogo[] = selectedLotes.map((l) => ({
    key: l._id,
    label: l.numeroLote,
    cantidadLotes: 1,
    eficienciaBiologicaPromedio: l.resumen.eficienciaBiologica,
    diasTotalesPromedio: l.resumen.diasTotales,
    costoPorKgPromedio: l.resumen.costoProduccion.costoPorKgProducido,
  }));

  useEffect(() => {
    apiFetch<StatsResponse>("/api/stats")
      .then(setStats)
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "No se pudieron cargar las estadísticas")
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="p-4 text-sm text-muted-foreground">Cargando…</p>;
  }

  if (!stats) {
    return <p className="p-4 text-sm text-muted-foreground">No hay datos disponibles.</p>;
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">Estadísticas</h1>

      <KpiCards kpis={stats.kpis} />

      <Card>
        <CardHeader>
          <CardTitle>Comparar lotes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <LoteSelector
            lotes={stats.lotes}
            selectedIds={selectedLoteIds}
            onChange={setSelectedLoteIds}
          />

          {selectedLotes.length > 0 && (
            <>
              <LoteComparisonTable lotes={selectedLotes} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <AgregadoComparisonChart
                  data={comparisonData}
                  metric="eficienciaBiologicaPromedio"
                  title="Eficiencia biológica"
                  unit="%"
                  color={CHART_PALETTE[0]}
                  emptyMessage="Ninguno de los lotes seleccionados tiene eficiencia biológica calculable todavía (falta el peso de sustrato)."
                />
                <AgregadoComparisonChart
                  data={comparisonData}
                  metric="diasTotalesPromedio"
                  title="Días totales"
                  unit="d"
                  color={CHART_PALETTE[1]}
                  emptyMessage="Sin datos de días totales para los lotes seleccionados."
                />
                <AgregadoComparisonChart
                  data={comparisonData}
                  metric="costoPorKgPromedio"
                  title="Costo por kg"
                  unit="$"
                  color={CHART_PALETTE[2]}
                  emptyMessage="Ninguno de los lotes seleccionados tiene cosecha registrada todavía."
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lotes por etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <EstadoDistributionChart data={stats.distribucionPorEstado} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lotes demorados</CardTitle>
        </CardHeader>
        <CardContent>
          <LotesDemoradosPanel lotes={stats.lotesDemorados} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comparativa por tipo de hongo</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <AgregadoComparisonChart
            data={stats.agregados.porHongo}
            metric="eficienciaBiologicaPromedio"
            title="Eficiencia biológica"
            unit="%"
            color={CHART_PALETTE[0]}
          />
          <AgregadoComparisonChart
            data={stats.agregados.porHongo}
            metric="diasTotalesPromedio"
            title="Días totales"
            unit="d"
            color={CHART_PALETTE[1]}
          />
          <AgregadoComparisonChart
            data={stats.agregados.porHongo}
            metric="costoPorKgPromedio"
            title="Costo por kg"
            unit="$"
            color={CHART_PALETTE[2]}
          />
        </CardContent>
        <CardContent className="pt-0 text-xs text-muted-foreground">
          Calculado solo sobre lotes finalizados.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comparativa por tipo de grano</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <AgregadoComparisonChart
            data={stats.agregados.porGrano}
            metric="eficienciaBiologicaPromedio"
            title="Eficiencia biológica"
            unit="%"
            color={CHART_PALETTE[0]}
          />
          <AgregadoComparisonChart
            data={stats.agregados.porGrano}
            metric="diasTotalesPromedio"
            title="Días totales"
            unit="d"
            color={CHART_PALETTE[1]}
          />
          <AgregadoComparisonChart
            data={stats.agregados.porGrano}
            metric="costoPorKgPromedio"
            title="Costo por kg"
            unit="$"
            color={CHART_PALETTE[2]}
          />
        </CardContent>
        <CardContent className="pt-0 text-xs text-muted-foreground">
          Calculado solo sobre lotes finalizados.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comparativa por tipo de sustrato</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <AgregadoComparisonChart
            data={stats.agregados.porSustrato}
            metric="eficienciaBiologicaPromedio"
            title="Eficiencia biológica"
            unit="%"
            color={CHART_PALETTE[0]}
          />
          <AgregadoComparisonChart
            data={stats.agregados.porSustrato}
            metric="diasTotalesPromedio"
            title="Días totales"
            unit="d"
            color={CHART_PALETTE[1]}
          />
          <AgregadoComparisonChart
            data={stats.agregados.porSustrato}
            metric="costoPorKgPromedio"
            title="Costo por kg"
            unit="$"
            color={CHART_PALETTE[2]}
          />
        </CardContent>
        <CardContent className="pt-0 text-xs text-muted-foreground">
          Calculado solo sobre lotes finalizados.
        </CardContent>
      </Card>
    </div>
  );
}
