"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useFormat } from "@/components/kallampa/useFormat";
import { formatTick, xTicks, yDomain } from "@/lib/monitoreo/escalas";
import type { Rango, SerieRow, TipoSerie } from "@/lib/monitoreo/tipos";
import { formatDuracion, formatHora } from "./formato";

// Enfasis: un color + gris. Validados contra --surface-card (#232532) con
// scripts/validate_palette.js del skill dataviz: separacion normal ΔE 16,4 y
// CVD ΔE 15,3. El gris queda en 2,87:1 de contraste, por eso el dato siempre
// esta tambien en el tooltip y en la tabla de ciclos. No variar la opacidad
// segun el tiempo prendido (eso va en el tooltip).
export const COLOR_PRENDIDO = "#9184d9"; // --color-accent
export const COLOR_APAGADO = "#676b7b"; // entre neutral-600 y neutral-700

export interface RefLine {
  value: number;
  label: string;
}

interface BarChartProps {
  rows: SerieRow[];
  windowSec: number;
  range: Rango;
  desde: number;
  hasta: number;
  unit: string;
  refLines: RefLine[];
  /** "Temperatura" / "Humedad" y "Calefacción" / "Humidificador" para el tooltip. */
  valorLabel: string;
  actuadorLabel: string;
  /** Para la concordancia del texto (la calefaccion / el humidificador). */
  tipo: TipoSerie;
  height?: number;
}

const M = { top: 22, right: 52, bottom: 24, left: 40 };

/**
 * Barras de promedio por ventana ubicadas en el tiempo real (huecos donde no
 * hay datos), naciendo del borde inferior del dominio; color segun si el
 * actuador estuvo prendido en la ventana. Un solo eje Y.
 */
export function BarChart({
  rows,
  windowSec,
  range,
  desde,
  hasta,
  unit,
  refLines,
  valorLabel,
  actuadorLabel,
  tipo,
  height = 240,
}: BarChartProps) {
  const t = useTranslations("components.monitoreo");
  const fmt = useFormat();
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    // Ancho inicial sincronico (no depende del primer callback del observer,
    // que el navegador puede demorar, p. ej. con la pestaña en segundo plano).
    setWidth(Math.floor(el.clientWidth));
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const plotW = Math.max(0, width - M.left - M.right);
  const plotH = height - M.top - M.bottom;
  const span = Math.max(1, hasta - desde);
  const x = (tt: number) => M.left + ((tt - desde) / span) * plotW;

  const dom = useMemo(
    () => yDomain(rows.map((r) => r.valor), refLines.map((r) => r.value)),
    [rows, refLines]
  );
  const y = (v: number) =>
    M.top + plotH - ((v - dom.min) / Math.max(1e-9, dom.max - dom.min)) * plotH;
  const decY = dom.step < 1 ? 1 : 0;

  const colW = (windowSec * 1000 * plotW) / span;
  const gap = colW >= 8 ? 2 : colW >= 4 ? 1 : 0;
  const barW = Math.max(1, colW - gap);
  const ticksX = width ? xTicks(range, desde, hasta, plotW) : [];

  const activa = hover != null ? rows[hover] : null;
  const tipLeft = activa ? Math.min(Math.max(x(activa.t) + colW / 2, 90), width - 90) : 0;

  return (
    <div ref={boxRef} className="relative w-full select-none" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={t("chartAria", { valor: valorLabel, tipo })}
          onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}
        >
          {/* grilla + eje Y */}
          {dom.ticks.map((v) => (
            <g key={v}>
              <line
                x1={M.left}
                x2={M.left + plotW}
                y1={y(v)}
                y2={y(v)}
                stroke="var(--color-divider)"
                strokeOpacity={0.6}
              />
              <text
                x={M.left - 6}
                y={y(v)}
                dy="0.32em"
                textAnchor="end"
                fontSize={11}
                fill="var(--text-subtle)"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {fmt.number(v, decY)}
              </text>
            </g>
          ))}
          <text x={M.left - 6} y={10} textAnchor="end" fontSize={10} fill="var(--text-subtle)">
            {unit}
          </text>

          {/* eje X */}
          <line
            x1={M.left}
            x2={M.left + plotW}
            y1={M.top + plotH}
            y2={M.top + plotH}
            stroke="var(--color-divider)"
          />
          {ticksX.map((tt) => (
            <text
              key={tt}
              x={x(tt)}
              y={height - 6}
              textAnchor="middle"
              fontSize={11}
              fill="var(--text-subtle)"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatTick(tt, range)}
            </text>
          ))}

          {/* columna activa */}
          {activa && (
            <rect
              x={x(activa.t)}
              y={M.top}
              width={Math.max(colW, 2)}
              height={plotH}
              fill="color-mix(in srgb, var(--color-text) 7%, transparent)"
            />
          )}

          {/* barras */}
          {rows.map((r) => {
            if (r.valor == null) return null;
            const x0 = x(r.t) + gap / 2;
            const top = Math.min(y(r.valor), M.top + plotH - 1);
            const h = M.top + plotH - top;
            const rad = Math.min(2, barW / 2, h);
            return (
              <path
                key={r.t}
                d={`M${x0},${top + h}V${top + rad}Q${x0},${top} ${x0 + rad},${top}H${x0 + barW - rad}Q${x0 + barW},${top} ${x0 + barW},${top + rad}V${top + h}Z`}
                fill={r.onSeg > 0 ? COLOR_PRENDIDO : COLOR_APAGADO}
              />
            );
          })}

          {/* lineas de referencia (min / max configuradas) */}
          {refLines.map((ref) => (
            <g key={ref.label}>
              <line
                x1={M.left}
                x2={M.left + plotW}
                y1={y(ref.value)}
                y2={y(ref.value)}
                stroke="var(--color-text)"
                strokeOpacity={0.7}
                strokeDasharray="4 3"
              />
              <text
                x={M.left + plotW + 6}
                y={y(ref.value)}
                dy="0.32em"
                fontSize={11}
                fill="var(--text-muted)"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {ref.label}
              </text>
            </g>
          ))}

          {/* zonas activas: la columna completa */}
          {rows.map((r, i) => (
            <rect
              key={`hit-${r.t}`}
              x={x(r.t)}
              y={M.top}
              width={Math.max(colW, 1)}
              height={plotH}
              fill="transparent"
              onPointerEnter={() => setHover(i)}
              onPointerDown={() => setHover(i)}
            />
          ))}
        </svg>
      )}

      {activa && (
        <div
          role="status"
          className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-md bg-surface-card px-2.5 py-2 text-xs whitespace-nowrap shadow-lg"
          style={{ left: tipLeft }}
        >
          <div className="mb-0.5 text-text-muted tabular-nums">
            {formatHora(activa.t, range)} – {formatHora(activa.t + windowSec * 1000, range, false)}
          </div>
          <div>
            {valorLabel}{" "}
            <strong className="font-medium tabular-nums">
              {activa.valor == null ? t("sinDato") : `${fmt.number(activa.valor, 1)} ${unit}`}
            </strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-[2px]"
              style={{ background: activa.onSeg > 0 ? COLOR_PRENDIDO : COLOR_APAGADO }}
            />
            {actuadorLabel}{" "}
            {activa.onSeg > 0
              ? t("prendidaDurante", { tipo, duracion: formatDuracion(activa.onSeg, fmt.number) })
              : t("apagada", { tipo })}
          </div>
        </div>
      )}
    </div>
  );
}
