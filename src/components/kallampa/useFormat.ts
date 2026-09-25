"use client";

import { useMemo } from "react";
import { useAppLocale } from "@/components/shared/LocaleProvider";
import {
  formatFechaCorta,
  formatKg,
  formatMoney,
  formatNumber,
  formatPct,
} from "@/lib/format";

/** Formateadores de numeros/fechas ligados al idioma activo. */
export function useFormat() {
  const { locale } = useAppLocale();
  return useMemo(
    () => ({
      kg: (v: number | null | undefined, decimals?: number) => formatKg(v, locale, decimals),
      pct: (v: number | null | undefined, decimals?: number) => formatPct(v, locale, decimals),
      money: (v: number | null | undefined, decimals?: number) =>
        formatMoney(v, locale, decimals),
      number: (v: number | null | undefined, decimals?: number) =>
        formatNumber(v, locale, decimals),
      fecha: formatFechaCorta,
    }),
    [locale]
  );
}
