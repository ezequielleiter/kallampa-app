"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Plus, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { KanbanColumn } from "./KanbanColumn";
import { StageAdvanceSheet } from "@/components/batch/StageAdvanceSheet";
import { apiFetch } from "@/lib/api-client";
import { KANBAN_ESTADOS, type BatchEstado } from "@/lib/constants";
import type { Batch } from "@/lib/types";

export function KanbanBoard() {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarDescartados, setMostrarDescartados] = useState(false);
  const [pendingAdvance, setPendingAdvance] = useState<{
    batch: Batch;
    targetStage: Exclude<BatchEstado, "inoculacion_grano" | "descartado">;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Batch[]>("/api/batches");
      setBatches(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron cargar los lotes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => cargar());
  }, [cargar]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const sourceEstado = active.data.current?.estado as BatchEstado | undefined;
    const targetEstado = over.id as BatchEstado;
    if (!sourceEstado || sourceEstado === targetEstado) return;
    if (targetEstado === "inoculacion_grano" || targetEstado === "descartado") return;

    const batch = batches.find((b) => b._id === active.id);
    if (!batch) return;

    setPendingAdvance({ batch, targetStage: targetEstado });
  }

  const activos = batches.filter((b) => b.estado !== "descartado");
  const descartados = batches.filter((b) => b.estado === "descartado");

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Tablero de lotes</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarDescartados((v) => !v)}
          >
            <Eye /> {mostrarDescartados ? "Ocultar" : "Ver"} descartados ({descartados.length})
          </Button>
          <Button size="sm" onClick={() => router.push("/lotes/nuevo")}>
            <Plus /> Nuevo lote
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {KANBAN_ESTADOS.map((estado) => (
              <KanbanColumn
                key={estado}
                estado={estado}
                batches={activos.filter((b) => b.estado === estado)}
                onCardClick={(batch) => router.push(`/lotes/${batch._id}`)}
              />
            ))}
          </div>
        </DndContext>
      )}

      {mostrarDescartados && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/20 p-3">
          <h2 className="text-sm font-semibold">Lotes descartados</h2>
          {descartados.length === 0 && (
            <p className="text-xs text-muted-foreground">No hay lotes descartados.</p>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {descartados.map((batch) => (
              <button
                key={batch._id}
                onClick={() => router.push(`/lotes/${batch._id}`)}
                className="flex flex-col gap-1 rounded-lg border border-border bg-background p-2.5 text-left text-sm hover:bg-muted"
              >
                <span className="font-medium">{batch.numeroLote}</span>
                <span className="text-xs text-muted-foreground">
                  {batch.fungusTypeId?.nombre} · {batch.motivoDescarte}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {pendingAdvance && (
        <StageAdvanceSheet
          open={!!pendingAdvance}
          onOpenChange={(open) => {
            if (!open) setPendingAdvance(null);
          }}
          batchId={pendingAdvance.batch._id}
          targetStage={pendingAdvance.targetStage}
          fungusType={pendingAdvance.batch.fungusTypeId}
          onSuccess={cargar}
        />
      )}
    </div>
  );
}
