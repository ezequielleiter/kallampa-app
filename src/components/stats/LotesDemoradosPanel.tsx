"use client";

import { TriangleAlert } from "lucide-react";
import { BATCH_ESTADO_LABELS } from "@/lib/constants";
import type { StatsLoteDemorado } from "@/lib/types";

interface LotesDemoradosPanelProps {
  lotes: StatsLoteDemorado[];
}

export function LotesDemoradosPanel({ lotes }: LotesDemoradosPanelProps) {
  if (lotes.length === 0) {
    return <p className="text-sm text-muted-foreground">Ningún lote está demorado. 👍</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {lotes.map((lote) => (
        <li
          key={lote.numeroLote}
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm"
        >
          <TriangleAlert className="size-4 shrink-0 text-destructive" />
          <span className="font-medium">{lote.numeroLote}</span>
          <span className="text-muted-foreground">({BATCH_ESTADO_LABELS[lote.estado]})</span>
          <span className="ml-auto font-medium text-destructive">
            +{lote.diasDeDemora} día(s)
          </span>
        </li>
      ))}
    </ul>
  );
}
