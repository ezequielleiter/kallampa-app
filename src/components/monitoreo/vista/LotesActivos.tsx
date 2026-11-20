"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { StatusTag } from "@/components/kallampa/StatusTag";
import type { GestionResumen } from "@/lib/types";

/** Lotes en curso, cada uno con enlace a su detalle. */
export function LotesActivos({ lotes }: { lotes: GestionResumen["lotesActivos"] }) {
  const t = useTranslations("pages.monitoreo");
  if (lotes.length === 0) return <p className="m-0 text-[13px] text-text-subtle">{t("sinLotesActivos")}</p>;
  return (
    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
      {lotes.map((l) => (
        <li key={l._id}>
          <Link
            href={`/lotes/${l._id}`}
            className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 rounded-md bg-surface-inset px-3 py-2.5 text-[13px] hover:bg-hover"
          >
            <span className="font-medium tabular-nums">{l.numeroLote}</span>
            <span className="min-w-0 text-text-muted">{l.hongo}</span>
            <span className="text-text-subtle tabular-nums">{t("frascosActivos", { count: l.frascosActivos })}</span>
            <span className="ml-auto flex flex-wrap items-center gap-1.5">
              {l.incubando > 0 && (
                <StatusTag kind="recipiente" estado="incubando" className="text-xs">
                  {t("incubando", { count: l.incubando })}
                </StatusTag>
              )}
              {l.fructificando > 0 && (
                <StatusTag kind="recipiente" estado="fructificando" className="text-xs">
                  {t("fructificando", { count: l.fructificando })}
                </StatusTag>
              )}
              {l.alertas > 0 && (
                <span className="flex items-center gap-1 text-danger-text tabular-nums">
                  <WarningCircleIcon aria-hidden="true" className="size-4" />
                  {t("alertas", { count: l.alertas })}
                </span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
