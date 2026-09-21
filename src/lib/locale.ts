import { getSession } from "@/lib/session";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/messages";

// Idioma activo: si hay sesion, la cuenta manda (Session.user.locale);
// si no (pantallas /login, /registro), se usa una preferencia guardada
// solo en este navegador. Mismo criterio defensivo que session.ts.
const STORAGE_KEY = "locale";

export function getStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "es" || raw === "en" ? raw : null;
  } catch {
    return null;
  }
}

export function setStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // localStorage puede fallar en modo privado/incógnito o con site data bloqueada
  }
}

export function getLocale(): Locale {
  const session = getSession();
  if (session?.user.locale) return session.user.locale;
  return getStoredLocale() ?? DEFAULT_LOCALE;
}
