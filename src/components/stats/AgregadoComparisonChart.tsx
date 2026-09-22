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
  const resolvedEmptyMessage = emptyMessage ?? t("emptyMessage");
  const chartData = data
    .filter((d) => d[metric] !== null)
    .map((d) => ({ label: d.label, value: Number((d[metric] as number).toFixed(2)) }));

  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
      {chartData.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">{resolvedEmptyMessage}</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} />
            <YAxis tick={{ fontSize: 11 }} unit={unit} />
            <Tooltip
              formatter={(value) => [`${value} ${unit}`, title] as [string, string]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} name={title} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
