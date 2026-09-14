"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { TriangleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { alertaEtapaActual, type LeanBatch } from "@/lib/metrics";
import type { Batch } from "@/lib/types";

interface KanbanCardProps {
  batch: Batch;
  onClick: () => void;
}

export function KanbanCard({ batch, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: batch._id,
    data: { estado: batch.estado },
  });

  const alerta = alertaEtapaActual(batch as unknown as LeanBatch);

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      size="sm"
      className="cursor-grab touch-none select-none transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-lifted)] active:cursor-grabbing"
    >
      <CardContent className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{batch.numeroLote}</span>
          {alerta.demorado && (
            <Badge variant="destructive">
              <TriangleAlert /> +{alerta.diasDeDemora}d
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{batch.fungusTypeId?.nombre}</span>
        <span className="text-xs text-muted-foreground">
          {alerta.diasTranscurridos} día{alerta.diasTranscurridos === 1 ? "" : "s"} en esta etapa
          {alerta.diasEsperados > 0 ? ` (esperado: ${alerta.diasEsperados})` : ""}
        </span>
      </CardContent>
    </Card>
  );
}
