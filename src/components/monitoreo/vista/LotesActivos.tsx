"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { WarningCircleIcon } from "@phosphor-icons/react";
import type { GestionResumen } from "@/lib/types";

/** Lotes en curso en filas compactas, cada una con enlace a su detalle. */
export function LotesActivos({ lotes }: { lotes: GestionResumen["lotesActivos"] }) {
  const t = useTranslations("pages.monitoreo");
  if (lotes.length === 0) return <p className="m-0 px-4 py-3 text-[13px] text-text-subtle">{t("sinLotesActivos")}</p>;
  return (
    <ul className="m-0 flex min-h-0 list-none flex-col overflow-auto p-0">
      {lotes.map((l) => (
        <li key={l._id} className="border-b border-divider last:border-b-0">
          <Link href={`/lotes/${l._id}`} className="flex flex-col gap-0.5 px-4 py-2 text-[13px] hover:bg-hover">
            <span className="flex items-baseline justify-between gap-2">
              <span className="font-tele font-medium tabular-nums">{l.numeroLote}</span>
              {l.alertas > 0 && (
                <span className="flex items-center gap-1 text-xs text-danger-text tabular-nums">
                  <WarningCircleIcon aria-hidden="true" className="size-3.5" />
                  {t("alertas", { count: l.alertas })}
                </span>
              )}
            </span>
            <span className="truncate text-xs text-text-subtle tabular-nums">
              {[
                l.hongo,
                t("frascosActivos", { count: l.frascosActivos }),
                l.incubando > 0 && t("incubando", { count: l.incubando }),
                l.fructificando > 0 && t("fructificando", { count: l.fructificando }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
