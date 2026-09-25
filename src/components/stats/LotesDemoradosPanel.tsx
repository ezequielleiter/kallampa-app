"use client";

import { useTranslations } from "next-intl";
import { HourglassMediumIcon } from "@phosphor-icons/react";
import type { StatsLoteDemorado } from "@/lib/types";

interface LotesDemoradosPanelProps {
  lotes: StatsLoteDemorado[];
}

// Coral solo en la demora (es lo que pide atencion); el resto neutro.
export function LotesDemoradosPanel({ lotes }: LotesDemoradosPanelProps) {
  const t = useTranslations("components.lotesDemoradosPanel");
  if (lotes.length === 0) {
    return <p className="text-[13px] text-text-subtle">{t("emptyState")}</p>;
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {lotes.map((lote) => (
        <li
          key={lote.numeroLote}
          className="flex items-center gap-2.5 rounded-md bg-surface-inset px-3 py-2.5 text-[13px]"
        >
          <HourglassMediumIcon className="size-4 shrink-0 text-danger-text" />
          <span className="font-medium tabular-nums">{lote.numeroLote}</span>
          <span className="ml-auto text-danger-text tabular-nums">
            {t("diasDemora", { count: lote.diasDeDemora })}
          </span>
        </li>
      ))}
    </ul>
  );
}
