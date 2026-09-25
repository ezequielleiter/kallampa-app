import type { Rango } from "./tipos";

const PASOS_LINDOS = [0.2, 0.5, 1, 2, 5, 10, 20, 50];

/**
 * Dominio del eje Y: [min(datos, refs) − 0,5 ; max(datos, refs) + 0,5]
 * redondeado a un paso "lindo" buscando ~4 marcas. No arranca en 0.
 */
export function yDomain(
  values: (number | null)[],
  refs: (number | null | undefined)[] = []
): { min: number; max: number; step: number; ticks: number[] } {
  const xs = [...values, ...refs].filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v)
  );
  if (!xs.length) return { min: 0, max: 1, step: 0.2, ticks: [0, 0.2, 0.4, 0.6, 0.8, 1] };
  const lo = Math.min(...xs) - 0.5;
  const hi = Math.max(...xs) + 0.5;
  const crudo = (hi - lo) / 4;
  const step = PASOS_LINDOS.find((p) => p >= crudo) ?? PASOS_LINDOS[PASOS_LINDOS.length - 1];
  const min = Math.floor(lo / step) * step;
  const max = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = min; v <= max + step / 1000; v += step) ticks.push(Number(v.toFixed(6)));
  return { min: Number(min.toFixed(6)), max: Number(max.toFixed(6)), step, ticks };
}

const PASO_X_SEG: Record<Rango, number> = {
  "1h": 10 * 60,
  "2h": 15 * 60,
  "6h": 3600,
  "24h": 4 * 3600,
  "7d": 24 * 3600,
};

/**
 * Marcas del eje X alineadas al paso del rango (en hora local), duplicando el
 * paso mientras queden a menos de `minPx` entre si.
 */
export function xTicks(
  range: Rango,
  desde: number,
  hasta: number,
  anchoPx: number,
  minPx = 48
): number[] {
  let paso = PASO_X_SEG[range] * 1000;
  const total = hasta - desde;
  while (anchoPx > 0 && (paso / total) * anchoPx < minPx && paso < total) paso *= 2;
  // Alinear a la hora local: offset de zona en ms.
  const tz = new Date(desde).getTimezoneOffset() * 60 * 1000;
  const primero = Math.ceil((desde - tz) / paso) * paso + tz;
  const out: number[] = [];
  for (let t = primero; t <= hasta; t += paso) out.push(t);
  return out;
}

export function formatTick(t: number, range: Rango): string {
  const d = new Date(t);
  const pad = (n: number) => String(n).padStart(2, "0");
  return range === "7d"
    ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
    : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
