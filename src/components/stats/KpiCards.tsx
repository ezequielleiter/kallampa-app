"use client";

import { useTranslations } from "next-intl";
import { KpiGrid } from "@/components/kallampa/Kpi";
import { useFormat } from "@/components/kallampa/useFormat";
import type { StatsKpis } from "@/lib/types";

interface KpiCardsProps {
  kpis: StatsKpis;
}

export function KpiCards({ kpis }: KpiCardsProps) {
  const t = useTranslations("components.kpiCards");
  const fmt = useFormat();
  const items = [
    { label: t("lotesActivos"), value: fmt.number(kpis.lotesActivos) },
    { label: t("lotesFinalizados"), value: fmt.number(kpis.lotesFinalizados) },
    { label: t("lotesDescartados"), value: fmt.number(kpis.lotesDescartados) },
    {
      label: t("lotesDemorados"),
      value: (
        <span className={kpis.lotesDemorados > 0 ? "text-danger-text" : undefined}>
          {fmt.number(kpis.lotesDemorados)}
        </span>
      ),
    },
    { label: t("eficienciaBiologicaPromedio"), value: fmt.pct(kpis.eficienciaBiologicaPromedio) },
    { label: t("costoPorKgPromedio"), value: fmt.money(kpis.costoPorKgPromedio) },
    { label: t("pesoTotalProducido"), value: fmt.kg(kpis.pesoTotalProducidoKg, 1) },
  ];

  return (
    <div className="rounded-lg bg-surface-card px-5 py-4 shadow-sm">
      <KpiGrid items={items} min={150} className="gap-y-4" />
    </div>
  );
}
