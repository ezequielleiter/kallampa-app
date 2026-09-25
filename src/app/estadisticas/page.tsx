"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/kallampa/SectionCard";
import { EmptyState, PageContainer, PageHeader } from "@/components/kallampa/PageHeader";
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

  if (loading || !stats) {
    return (
      <PageContainer>
        <PageHeader title={t("title")} />
        <EmptyState>{loading ? t("loading") : t("noData")}</EmptyState>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="gap-3.5">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle", { count: stats.kpis.totalLotes })}
      />

      <KpiCards kpis={stats.kpis} />

      <SectionCard title={t("compararLotes")}>
        <div className="flex flex-col gap-4">
          <LoteSelector
            lotes={stats.lotes}
            selectedIds={selectedLoteIds}
            onChange={setSelectedLoteIds}
          />

          {selectedLotes.length > 0 && (
            <>
              <LoteComparisonTable lotes={selectedLotes} />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 items-start gap-3.5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <SectionCard title={t("recipientesPorEstado")}>
          <EstadoDistributionChart data={stats.distribucionPorEstado} />
        </SectionCard>

        <SectionCard
          title={t("lotesDemorados")}
          meta={stats.lotesDemorados.length > 0 ? stats.lotesDemorados.length : undefined}
        >
          <LotesDemoradosPanel lotes={stats.lotesDemorados} />
        </SectionCard>
      </div>

      <SectionCard title={t("comparativaHongo")} meta={t("soloFinalizados")}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
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
        </div>
      </SectionCard>

      <SectionCard title={t("comparativaGrano")} meta={t("soloFinalizados")}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
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
        </div>
      </SectionCard>

      <SectionCard title={t("comparativaSustrato")} meta={t("soloFinalizados")}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
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
        </div>
      </SectionCard>
    </PageContainer>
  );
}
