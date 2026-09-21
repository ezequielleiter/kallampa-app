import { getLocale } from "@/lib/locale";
import { getErrorMessages } from "@/i18n/messages";

/**
 * Traduce un mensaje con la convención "<code>:<mensaje en español>" (ver
 * src/lib/api-utils.ts) al idioma activo. Se usa tanto para los errores que
 * tira `apiFetch` (src/lib/api-client.ts) como para los mensajes de campo
 * que React Hook Form muestra directo desde un Zod schema compartido con el
 * backend (ej. `errors.identificador?.message`) — en ambos casos el string
 * crudo nunca debe llegar a la UI tal cual si tiene el prefijo "code:".
 */
export function translateErrorMessage(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  const idx = raw.indexOf(":");
  if (idx === -1) return raw;
  const code = raw.slice(0, idx);
  const message = raw.slice(idx + 1);

  if (getLocale() === "en") {
    const translated = getErrorMessages("en")[code];
    if (translated) return translated;
  }
  return message;
}

/** Traduce un array de codes (caso Zod multi-issue) y los une con "; ".
 * Si falta la traduccion de alguno, devuelve `null` para que el caller use
 * el `error` en español completo en vez de un mensaje parcialmente traducido. */
export function translateErrorCodes(codes: string[]): string | null {
  if (getLocale() !== "en") return null;
  const dict = getErrorMessages("en");
  const translated = codes.map((c) => dict[c]);
  if (translated.some((t) => !t)) return null;
  return translated.join("; ");
}
