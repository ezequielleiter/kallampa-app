"use client";

import { useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AgregadoCatalogo } from "@/lib/metrics";
import { useFormat } from "@/components/kallampa/useFormat";
import {
  CHART_AXIS,
  CHART_GRID_STROKE,
  CHART_TICK,
  CHART_TOOLTIP_CURSOR,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_STYLE,
} from "./chartTheme";

interface AgregadoComparisonChartProps {
  data: AgregadoCatalogo[];
  metric: "eficienciaBiologicaPromedio" | "diasTotalesPromedio" | "costoPorKgPromedio";
  title: string;
  unit: string;
  color: string;
  emptyMessage?: string;
}

export function AgregadoComparisonChart({
  data,
  metric,
  title,
  unit,
  color,
  emptyMessage,
}: AgregadoComparisonChartProps) {
  const t = useTranslations("components.agregadoComparisonChart");
  const fmt = useFormat();
  const resolvedEmptyMessage = emptyMessage ?? t("emptyMessage");
  const chartData = data
    .filter((d) => d[metric] !== null)
    .map((d) => ({ label: d.label, value: Number((d[metric] as number).toFixed(2)) }));

  // Formato del DS por unidad: "80,0 %", "$ 9.160", "12 d".
  function formatValue(v: number) {
    if (unit === "%") return fmt.pct(v);
    if (unit === "$") return fmt.money(v);
    return `${fmt.number(v)} ${unit}`;
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <h3 className="m-0 text-xs font-normal text-text-subtle">{title}</h3>
      {chartData.length === 0 ? (
        <p className="flex h-[220px] items-center justify-center rounded-md bg-surface-inset px-4 text-center text-xs text-text-subtle">
          {resolvedEmptyMessage}
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid stroke={CHART_GRID_STROKE} vertical={false} />
            <XAxis dataKey="label" tick={CHART_TICK} {...CHART_AXIS} interval={0} />
            <YAxis
              tick={CHART_TICK}
              {...CHART_AXIS}
              axisLine={false}
              width={48}
              tickFormatter={(v: number) =>
                unit === "$" ? fmt.money(v) : unit === "%" ? fmt.number(v) : fmt.number(v)
              }
            />
            <Tooltip
              cursor={CHART_TOOLTIP_CURSOR}
              formatter={(value) => [formatValue(Number(value)), title] as [string, string]}
              contentStyle={CHART_TOOLTIP_STYLE}
              labelStyle={CHART_TOOLTIP_LABEL_STYLE}
              itemStyle={{ color: "var(--color-text)" }}
            />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={40} name={title} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
