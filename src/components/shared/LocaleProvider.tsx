"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, DEFAULT_LOCALE, type Locale } from "@/i18n/messages";
import { getLocale as resolveLocale, setStoredLocale } from "@/lib/locale";
import { getSession, saveSession } from "@/lib/session";
import { apiFetch } from "@/lib/api-client";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

/** Lee/cambia el idioma activo. `setLocale` persiste local y, si hay
 * sesión, también en la cuenta (PATCH /api/auth/me). */
export function useAppLocale() {
  return useContext(LocaleContext);
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Se resuelve client-side (sesión o localStorage) recién después del
  // primer render para evitar un mismatch de hidratación SSR/cliente.
  useEffect(() => {
    void Promise.resolve().then(() => setLocaleState(resolveLocale()));
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  async function setLocale(next: Locale) {
    setLocaleState(next);
    setStoredLocale(next);

    const session = getSession();
    if (!session) return;
    try {
      const updated = await apiFetch<{
        _id: string;
        username: string;
        email: string;
        locale: Locale;
      }>("/api/auth/me", { method: "PATCH", body: JSON.stringify({ locale: next }) });
      saveSession({ ...session, user: updated });
    } catch {
      // Si falla la persistencia en la cuenta, el idioma sigue aplicado
      // localmente -- no bloqueamos el cambio visual por un error de red.
    }
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider
        locale={locale}
        messages={getMessages(locale)}
        timeZone="America/Argentina/Buenos_Aires"
      >
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}
