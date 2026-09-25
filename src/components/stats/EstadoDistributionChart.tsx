"use client";

import { useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  RECIPIENTE_ESTADO_COLORS,
  CHART_PALETTE,
  type RecipienteEstado,
} from "@/lib/constants";
import {
  CHART_AXIS,
  CHART_GRID_STROKE,
  CHART_TICK,
  CHART_TOOLTIP_CURSOR,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_STYLE,
} from "./chartTheme";

interface EstadoDistributionChartProps {
  data: { label: string; value: number }[];
}

// v2: el batch ya no tiene un `estado` de etapa unica (solo el derivado
// binario en_progreso/finalizado), asi que esta distribucion pasa a
// representar los RECIPIENTES del sistema agrupados por su propio estado
// (incubando/fructificando/finalizado/contaminado/descartado) — es el
// equivalente mas cercano al viejo "lotes por etapa". Si el backend termina
// devolviendo otras claves, el fallback de abajo (paleta generica + label
// crudo) evita que el grafico rompa.
export function EstadoDistributionChart({ data }: EstadoDistributionChartProps) {
  const t = useTranslations("components.estadoDistributionChart");
  const tEstado = useTranslations("estados.recipiente");
  const chartData = data.map((d, i) => {
    const key = d.label as RecipienteEstado;
    let label = d.label;
    try {
      label = tEstado(key);
    } catch {
      // etiqueta desconocida (backend devolvió otra clave): usar el label crudo.
    }
    return {
      estado: d.label,
      label,
      value: d.value,
      color: RECIPIENTE_ESTADO_COLORS[key] ?? CHART_PALETTE[i % CHART_PALETTE.length],
    };
  });

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid stroke={CHART_GRID_STROKE} vertical={false} />
        <XAxis dataKey="label" tick={CHART_TICK} {...CHART_AXIS} interval={0} />
        <YAxis allowDecimals={false} tick={CHART_TICK} {...CHART_AXIS} axisLine={false} width={32} />
        <Tooltip
          cursor={CHART_TOOLTIP_CURSOR}
          formatter={(value) =>
            [t("countUnit", { count: Number(value) }), t("cantidad")] as [string, string]
          }
          contentStyle={CHART_TOOLTIP_STYLE}
          labelStyle={CHART_TOOLTIP_LABEL_STYLE}
          itemStyle={{ color: "var(--color-text)" }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56} name={t("recipientes")}>
          {chartData.map((entry) => (
            <Cell key={entry.estado} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
