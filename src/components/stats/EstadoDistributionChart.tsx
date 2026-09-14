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
import {
  RECIPIENTE_ESTADO_COLORS,
  RECIPIENTE_ESTADO_LABELS,
  CHART_PALETTE,
  type RecipienteEstado,
} from "@/lib/constants";

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
  const chartData = data.map((d, i) => {
    const key = d.label as RecipienteEstado;
    return {
      estado: d.label,
      label: RECIPIENTE_ESTADO_LABELS[key] ?? d.label,
      value: d.value,
      color: RECIPIENTE_ESTADO_COLORS[key] ?? CHART_PALETTE[i % CHART_PALETTE.length],
    };
  });

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
          formatter={(value) => [`${value} recipiente(s)`, "Cantidad"] as [string, string]}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Recipientes">
          {chartData.map((entry) => (
            <Cell key={entry.estado} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
