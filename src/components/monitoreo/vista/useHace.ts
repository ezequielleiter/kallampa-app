"use client";

import { useTranslations } from "next-intl";

/** "unos segundos", "12 min", "3 h", "2 días": para "hace …" con un `ms` transcurrido. */
export function useHace() {
  const t = useTranslations("pages.monitoreo.tiempo");
  return (ms: number) => {
    const min = Math.floor(Math.max(0, ms) / 60_000);
    if (min < 1) return t("segundos");
    if (min < 60) return t("minutos", { n: min });
    if (min < 24 * 60) return t("horas", { n: Math.floor(min / 60) });
    return t("dias", { n: Math.floor(min / (24 * 60)) });
  };
}
