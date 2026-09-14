"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { BatchEstado } from "@/lib/constants";
import { BATCH_ESTADO_COLORS, BATCH_ESTADO_LABELS } from "@/lib/constants";
import { KanbanCard } from "./KanbanCard";
import type { Batch } from "@/lib/types";

interface KanbanColumnProps {
  estado: BatchEstado;
  batches: Batch[];
  onCardClick: (batch: Batch) => void;
}

export function KanbanColumn({ estado, batches, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: estado });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-40 w-full flex-col gap-2 rounded-xl border border-border bg-muted/30 p-2.5 transition-colors sm:min-w-64",
        isOver && "bg-muted"
      )}
    >
      <div className="flex items-center gap-2 px-1 pb-1">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: BATCH_ESTADO_COLORS[estado] }}
        />
        <h3 className="text-sm font-semibold">{BATCH_ESTADO_LABELS[estado]}</h3>
        <span className="ml-auto text-xs text-muted-foreground">{batches.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {batches.map((batch) => (
          <KanbanCard key={batch._id} batch={batch} onClick={() => onCardClick(batch)} />
        ))}
        {batches.length === 0 && (
          <p className="px-1 text-xs text-muted-foreground">Sin lotes</p>
        )}
      </div>
    </div>
  );
}
