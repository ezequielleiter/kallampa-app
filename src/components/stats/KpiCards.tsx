"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import type { StatsKpis } from "@/lib/types";

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

interface KpiCardsProps {
  kpis: StatsKpis;
}

export function KpiCards({ kpis }: KpiCardsProps) {
  const t = useTranslations("components.kpiCards");
  const items = [
    { label: t("lotesActivos"), value: kpis.lotesActivos },
    { label: t("lotesFinalizados"), value: kpis.lotesFinalizados },
    { label: t("lotesDescartados"), value: kpis.lotesDescartados },
    { label: t("lotesDemorados"), value: kpis.lotesDemorados },
    {
      label: t("eficienciaBiologicaPromedio"),
      value:
        kpis.eficienciaBiologicaPromedio !== null
          ? `${kpis.eficienciaBiologicaPromedio.toFixed(1)}%`
          : "—",
    },
    {
      label: t("costoPorKgPromedio"),
      value:
        kpis.costoPorKgPromedio !== null ? currency.format(kpis.costoPorKgPromedio) : "—",
    },
    { label: t("pesoTotalProducido"), value: `${kpis.pesoTotalProducidoKg.toFixed(1)} kg` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} size="sm">
          <CardContent className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className="text-xl font-semibold">{item.value}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
