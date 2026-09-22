"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("pages.estadisticas");
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
      .catch((err) => toast.error(err instanceof Error ? err.message : t("loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) {
    return <p className="p-4 text-sm text-muted-foreground">{t("loading")}</p>;
  }

  if (!stats) {
    return <p className="p-4 text-sm text-muted-foreground">{t("noData")}</p>;
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">{t("title")}</h1>

      <KpiCards kpis={stats.kpis} />

      <Card>
        <CardHeader>
          <CardTitle>{t("compararLotes")}</CardTitle>
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
                  title={t("eficienciaBiologica")}
                  unit="%"
                  color={CHART_PALETTE[0]}
                  emptyMessage={t("emptyEficiencia")}
                />
                <AgregadoComparisonChart
                  data={comparisonData}
                  metric="diasTotalesPromedio"
                  title={t("diasTotales")}
                  unit="d"
                  color={CHART_PALETTE[1]}
                  emptyMessage={t("emptyDiasTotales")}
                />
                <AgregadoComparisonChart
                  data={comparisonData}
                  metric="costoPorKgPromedio"
                  title={t("costoPorKg")}
                  unit="$"
                  color={CHART_PALETTE[2]}
                  emptyMessage={t("emptyCosto")}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("recipientesPorEstado")}</CardTitle>
        </CardHeader>
        <CardContent>
          <EstadoDistributionChart data={stats.distribucionPorEstado} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("lotesDemorados")}</CardTitle>
        </CardHeader>
        <CardContent>
          <LotesDemoradosPanel lotes={stats.lotesDemorados} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("comparativaHongo")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <AgregadoComparisonChart
            data={stats.agregados.porHongo}
            metric="eficienciaBiologicaPromedio"
            title={t("eficienciaBiologica")}
            unit="%"
            color={CHART_PALETTE[0]}
          />
          <AgregadoComparisonChart
            data={stats.agregados.porHongo}
            metric="diasTotalesPromedio"
            title={t("diasTotales")}
            unit="d"
            color={CHART_PALETTE[1]}
          />
          <AgregadoComparisonChart
            data={stats.agregados.porHongo}
            metric="costoPorKgPromedio"
            title={t("costoPorKg")}
            unit="$"
            color={CHART_PALETTE[2]}
          />
        </CardContent>
        <CardContent className="pt-0 text-xs text-muted-foreground">
          {t("soloFinalizados")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("comparativaGrano")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <AgregadoComparisonChart
            data={stats.agregados.porGrano}
            metric="eficienciaBiologicaPromedio"
            title={t("eficienciaBiologica")}
            unit="%"
            color={CHART_PALETTE[0]}
          />
          <AgregadoComparisonChart
            data={stats.agregados.porGrano}
            metric="diasTotalesPromedio"
            title={t("diasTotales")}
            unit="d"
            color={CHART_PALETTE[1]}
          />
          <AgregadoComparisonChart
            data={stats.agregados.porGrano}
            metric="costoPorKgPromedio"
            title={t("costoPorKg")}
            unit="$"
            color={CHART_PALETTE[2]}
          />
        </CardContent>
        <CardContent className="pt-0 text-xs text-muted-foreground">
          {t("soloFinalizados")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("comparativaSustrato")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <AgregadoComparisonChart
            data={stats.agregados.porSustrato}
            metric="eficienciaBiologicaPromedio"
            title={t("eficienciaBiologica")}
            unit="%"
            color={CHART_PALETTE[0]}
          />
          <AgregadoComparisonChart
            data={stats.agregados.porSustrato}
            metric="diasTotalesPromedio"
            title={t("diasTotales")}
            unit="d"
            color={CHART_PALETTE[1]}
          />
          <AgregadoComparisonChart
            data={stats.agregados.porSustrato}
            metric="costoPorKgPromedio"
            title={t("costoPorKg")}
            unit="$"
            color={CHART_PALETTE[2]}
          />
        </CardContent>
        <CardContent className="pt-0 text-xs text-muted-foreground">
          {t("soloFinalizados")}
        </CardContent>
      </Card>
    </div>
  );
}
