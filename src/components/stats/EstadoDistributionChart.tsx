"use client";

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
import { BATCH_ESTADO_COLORS, BATCH_ESTADO_LABELS, type BatchEstado } from "@/lib/constants";

interface EstadoDistributionChartProps {
  data: { label: string; value: number }[];
}

export function EstadoDistributionChart({ data }: EstadoDistributionChartProps) {
  const chartData = data.map((d) => ({
    estado: d.label as BatchEstado,
    label: BATCH_ESTADO_LABELS[d.label as BatchEstado] ?? d.label,
    value: d.value,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          interval={0}
          angle={-15}
          textAnchor="end"
          height={50}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value) => [`${value} lote(s)`, "Cantidad"] as [string, string]}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Lotes">
          {chartData.map((entry) => (
            <Cell key={entry.estado} fill={BATCH_ESTADO_COLORS[entry.estado]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
