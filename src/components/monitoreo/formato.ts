import type { Rango } from "@/lib/monitoreo/tipos";

const pad = (n: number) => String(n).padStart(2, "0");

/** "HH:MM" local; en 7d antepone la fecha "dd/mm". */
export function formatHora(t: number, range: Rango, conFecha = true): string {
  const d = new Date(t);
  const hora = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return range === "7d" && conFecha ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${hora}` : hora;
}

/** "45 s", "3 min 20 s", "12 min", "1 h 05 min". */
export function formatDuracion(
  seg: number,
  number: (v: number, decimals?: number) => string = (v) => String(Math.round(v))
): string {
  const s = Math.round(seg);
  if (s < 60) return `${s} s`;
  if (s < 600 && s % 60) return `${Math.floor(s / 60)} min ${s % 60} s`;
  const min = Math.round(s / 60);
  if (min < 60) return `${number(min, 0)} min`;
  return `${Math.floor(min / 60)} h ${pad(min % 60)} min`;
}
