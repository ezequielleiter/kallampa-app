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

/**
 * Extracto en texto plano de un contenido Markdown, para listas (ej. lista
 * de Notas): saca la sintaxis mas comun (encabezados, enfasis, links,
 * código, listas) y corta a `maxLength` caracteres.
 */
export function extractoDeMarkdown(markdown: string, maxLength = 120): string {
  const textoPlano = markdown
    .replace(/```[\s\S]*?```/g, " ") // bloques de código
    .replace(/`([^`]*)`/g, "$1") // código inline
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // imágenes
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> texto
    .replace(/^#{1,6}\s+/gm, "") // encabezados
    .replace(/^>\s?/gm, "") // citas
    .replace(/^[-*+]\s+/gm, "") // listas
    .replace(/^\d+\.\s+/gm, "") // listas numeradas
    .replace(/[*_~]{1,3}/g, "") // énfasis/negrita/tachado
    .replace(/\s+/g, " ")
    .trim();

  if (textoPlano.length <= maxLength) return textoPlano;
  return `${textoPlano.slice(0, maxLength).trimEnd()}…`;
}

// --- Numeros -----------------------------------------------------------------
//
// Formato del DS: coma decimal, punto de miles y espacio antes de la unidad
// ("4,00 kg", "80,0 %", "$ 9.160"). Siempre cifras tabulares (lo resuelve el
// CSS). En ingles se usa el formato en-US pero con la misma estructura.
// Para usarlos desde componentes, preferir el hook `useFormat()`
// (src/components/kallampa/useFormat.ts), que ya toma el idioma activo.

export type NumberLocale = "es" | "en";

const INTL_LOCALE: Record<NumberLocale, string> = { es: "es-AR", en: "en-US" };

function nf(locale: NumberLocale, min: number, max = min) {
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });
}

const DASH = "—";

export function formatNumber(
  value: number | null | undefined,
  locale: NumberLocale = "es",
  decimals = 0
): string {
  if (value == null || !Number.isFinite(value)) return DASH;
  return nf(locale, decimals).format(value);
}

/** "4,00 kg" */
export function formatKg(
  value: number | null | undefined,
  locale: NumberLocale = "es",
  decimals = 2
): string {
  if (value == null || !Number.isFinite(value)) return DASH;
  return `${nf(locale, decimals).format(value)} kg`;
}

/** "80,0 %" */
export function formatPct(
  value: number | null | undefined,
  locale: NumberLocale = "es",
  decimals = 1
): string {
  if (value == null || !Number.isFinite(value)) return DASH;
  return `${nf(locale, decimals).format(value)} %`;
}

/** "$ 9.160" (sin decimales por defecto) */
export function formatMoney(
  value: number | null | undefined,
  locale: NumberLocale = "es",
  decimals = 0
): string {
  if (value == null || !Number.isFinite(value)) return DASH;
  return `$ ${nf(locale, decimals).format(value)}`;
}
