import commonEs from "../../messages/es/common.json";
import commonEn from "../../messages/en/common.json";
import pagesEs from "../../messages/es/pages.json";
import pagesEn from "../../messages/en/pages.json";
import componentsEs from "../../messages/es/components.json";
import componentsEn from "../../messages/en/components.json";
import errorsEs from "../../messages/es/errors.json";
import errorsEn from "../../messages/en/errors.json";

export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Messages = Record<string, any>;

// Cada archivo tiene su propia clave de nivel raiz (common/nav/auth/header/
// estados, pages, components, errors) por lo que el merge nunca pisa nada
// entre si -- permite que agentes/personas distintas editen cada archivo
// sin conflicto.
const MESSAGES: Record<Locale, Messages> = {
  es: { ...commonEs, ...pagesEs, ...componentsEs, ...errorsEs },
  en: { ...commonEn, ...pagesEn, ...componentsEn, ...errorsEn },
};

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}

export function getErrorMessages(locale: Locale): Record<string, string> {
  return (MESSAGES[locale].errors as Record<string, string>) ?? {};
}
