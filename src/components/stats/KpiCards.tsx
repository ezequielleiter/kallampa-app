"use client";

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
  const items = [
    { label: "Lotes activos", value: kpis.lotesActivos },
    { label: "Lotes finalizados", value: kpis.lotesFinalizados },
    { label: "Lotes descartados", value: kpis.lotesDescartados },
    { label: "Lotes demorados", value: kpis.lotesDemorados },
    {
      label: "Eficiencia biológica promedio",
      value:
        kpis.eficienciaBiologicaPromedio !== null
          ? `${kpis.eficienciaBiologicaPromedio.toFixed(1)}%`
          : "—",
    },
    {
      label: "Costo por kg promedio",
      value:
        kpis.costoPorKgPromedio !== null ? currency.format(kpis.costoPorKgPromedio) : "—",
    },
    { label: "Peso total producido", value: `${kpis.pesoTotalProducidoKg.toFixed(1)} kg` },
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
