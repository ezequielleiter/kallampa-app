import type { CSSProperties } from "react";

// Estilo comun de los graficos Recharts segun el DS: grilla y ejes en la
// divisoria, ticks de 11px en gris y tooltip como tarjeta flotante.
export const CHART_GRID_STROKE = "var(--color-divider)";

export const CHART_TICK = { fontSize: 11, fill: "var(--text-subtle)" };

export const CHART_AXIS = {
  stroke: "var(--color-divider)",
  tickLine: false,
} as const;

export const CHART_TOOLTIP_STYLE: CSSProperties = {
  background: "var(--surface-card)",
  border: "none",
  borderRadius: 8,
  boxShadow: "var(--shadow-lg)",
  fontSize: 12,
  color: "var(--color-text)",
};

export const CHART_TOOLTIP_LABEL_STYLE: CSSProperties = {
  color: "var(--text-muted)",
  marginBottom: 2,
};

export const CHART_TOOLTIP_CURSOR = {
  fill: "color-mix(in srgb, var(--color-text) 5%, transparent)",
};
