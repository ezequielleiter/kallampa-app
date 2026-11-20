import { cn } from "@/lib/utils";
import type { RangoObjetivo } from "@/lib/monitoreo/tipos";

/** Dominio comun para barra y grafica: valores + rango objetivo, con un margen. */
export function dominio(valores: (number | null)[], rango: RangoObjetivo, spanMin = 0): [number, number] {
  const xs = [...valores, rango.min, rango.max].filter((v): v is number => v != null && Number.isFinite(v));
  if (!xs.length) return [0, 1];
  let lo = Math.min(...xs);
  let hi = Math.max(...xs);
  // Escala minima: que el ruido del sensor (±0,1) no parezca un pico.
  if (hi - lo < spanMin) {
    const c = (hi + lo) / 2;
    lo = c - spanMin / 2;
    hi = c + spanMin / 2;
  }
  const pad = Math.max((hi - lo) * 0.15, 0.5);
  return [lo - pad, hi + pad];
}

const pct = (v: number, [lo, hi]: [number, number]) => ((v - lo) / (hi - lo || 1)) * 100;

/** Barra horizontal: banda del rango objetivo y marca del valor actual. */
export function RangoBarra({
  valor,
  rango,
  dom,
  fuera,
}: {
  valor: number | null;
  rango: RangoObjetivo;
  dom: [number, number];
  fuera: boolean;
}) {
  const desde = rango.min != null ? pct(rango.min, dom) : 0;
  const hasta = rango.max != null ? pct(rango.max, dom) : 100;
  return (
    <div aria-hidden="true" className="relative h-2 rounded-full bg-neutral-800">
      {(rango.min != null || rango.max != null) && (
        <div
          className="absolute inset-y-0 rounded-full bg-accent/30"
          style={{ left: `${desde}%`, width: `${Math.max(hasta - desde, 1)}%` }}
        />
      )}
      {valor != null && (
        <div
          className={cn(
            "absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full",
            fuera ? "bg-danger" : "bg-foreground"
          )}
          style={{ left: `${Math.min(100, Math.max(0, pct(valor, dom)))}%` }}
        />
      )}
    </div>
  );
}

/** Mini grafica de las ultimas 24 h con la banda del rango objetivo; los huecos cortan la linea. */
export function Sparkline({
  valores,
  rango,
  dom,
  fuera,
}: {
  valores: (number | null)[];
  rango: RangoObjetivo;
  dom: [number, number];
  fuera: boolean;
}) {
  const W = 480;
  const H = 60;
  const y = (v: number) => H - (pct(v, dom) / 100) * H;
  const x = (i: number) => (valores.length > 1 ? (i / (valores.length - 1)) * W : 0);

  const tramos: string[] = [];
  let actual: string[] = [];
  valores.forEach((v, i) => {
    if (v == null) {
      if (actual.length) tramos.push(actual.join(" "));
      actual = [];
    } else actual.push(`${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  });
  if (actual.length) tramos.push(actual.join(" "));

  const bandaTop = rango.max != null ? y(rango.max) : 0;
  const bandaBottom = rango.min != null ? y(rango.min) : H;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("block h-full w-full", fuera ? "text-danger-text" : "text-accent-300")}
    >
      {(rango.min != null || rango.max != null) && (
        <rect x={0} y={bandaTop} width={W} height={Math.max(bandaBottom - bandaTop, 1)} className="fill-accent/15" />
      )}
      {tramos.map((p, i) =>
        p.includes(" ") ? (
          <polyline
            key={i}
            points={p}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ) : (
          <circle key={i} cx={p.split(",")[0]} cy={p.split(",")[1]} r={1.5} fill="currentColor" />
        )
      )}
    </svg>
  );
}
