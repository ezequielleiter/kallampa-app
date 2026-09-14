/**
 * Las fechas que maneja la API (fechaInicio, fechaFin, oleada.fecha, etc.)
 * son "solo fecha" semanticamente (se guardan a medianoche UTC). Si las
 * formateamos construyendo un `new Date(iso)` y usando date-fns `format`
 * (que usa la zona horaria local del navegador), un operador en una zona
 * horaria negativa (ej. Argentina, UTC-3) ve la fecha del dia anterior.
 * Por eso leemos el año/mes/dia directo del string ISO en vez de pasar por
 * un Date local.
 */
export function formatFechaCorta(value: string | Date | undefined | null): string {
  if (!value) return "";
  const iso = typeof value === "string" ? value : value.toISOString();
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "";
  const [, y, m, d] = match;
  return `${d}/${m}/${y}`;
}
