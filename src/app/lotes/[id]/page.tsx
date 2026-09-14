"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BatchHeader } from "@/components/batch/BatchHeader";
import { BatchTimeline } from "@/components/batch/BatchTimeline";
import { JarsGrid } from "@/components/batch/JarsGrid";
import { FlushList } from "@/components/batch/FlushList";
import { DiscardDialog } from "@/components/batch/DiscardDialog";
import { StageAdvanceSheet } from "@/components/batch/StageAdvanceSheet";
import { apiFetch } from "@/lib/api-client";
import { resumenLote } from "@/lib/metrics";
import type { BatchWithJars } from "@/lib/types";
import type { BatchEstado } from "@/lib/constants";

const NEXT_STAGE: Partial<Record<BatchEstado, { target: BatchEstado; label: string }>> = {
  inoculacion_grano: { target: "crecimiento_sustrato", label: "Avanzar a crecimiento en sustrato" },
  crecimiento_sustrato: { target: "fructificacion", label: "Avanzar a fructificación" },
  fructificacion: { target: "cosecha", label: "Iniciar cosecha" },
  cosecha: { target: "finalizado", label: "Finalizar lote" },
};

export default function BatchDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [batch, setBatch] = useState<BatchWithJars | null>(null);
  const [loading, setLoading] = useState(true);
  const [advanceOpen, setAdvanceOpen] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const data = await apiFetch<BatchWithJars>(`/api/batches/${params.id}`);
      setBatch(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cargar el lote");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void Promise.resolve().then(() => cargar());
  }, [cargar]);

  if (loading) {
    return <p className="p-4 text-sm text-muted-foreground">Cargando…</p>;
  }

  if (!batch) {
    return <p className="p-4 text-sm text-muted-foreground">Lote no encontrado.</p>;
  }

  const resumen = resumenLote(batch);
  const siguienteEtapa = NEXT_STAGE[batch.estado];
  const puedeDescartar = batch.estado !== "finalizado" && batch.estado !== "descartado";
  const mostrarOleadas = batch.estado === "cosecha" || batch.estado === "finalizado";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4">
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push("/")}>
        ← Volver al tablero
      </Button>

      <BatchHeader batch={batch} resumen={resumen} />

      <Card>
        <CardHeader>
          <CardTitle>Línea de tiempo</CardTitle>
        </CardHeader>
        <CardContent>
          <BatchTimeline batch={batch} resumen={resumen} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {siguienteEtapa && (
          <Button onClick={() => setAdvanceOpen(true)}>{siguienteEtapa.label}</Button>
        )}
        {puedeDescartar && <DiscardDialog batchId={batch._id} onSuccess={cargar} />}
      </div>

      {batch.fructificacion?.recipientes && batch.fructificacion.recipientes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recipientes de fructificación</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {batch.fructificacion.recipientes.map((r) => (
              <div
                key={r._id ?? r.codigo}
                className="flex flex-col gap-0.5 rounded-lg border border-border p-2 text-sm"
              >
                <span className="font-medium">{r.codigo}</span>
                <span className="text-xs text-muted-foreground">{r.pesoKg} kg</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {mostrarOleadas && (
        <Card>
          <CardContent>
            <FlushList batch={batch} resumen={resumen} onChanged={cargar} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Frascos ({batch.jars.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <JarsGrid jars={batch.jars} onChanged={cargar} />
        </CardContent>
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground">
        Grano: {typeof batch.inoculacionGrano.tipoGranoId === "object"
          ? batch.inoculacionGrano.tipoGranoId.nombre
          : "—"}
        {batch.crecimientoSustrato?.tipoSustratoId && (
          <>
            {" · "}
            Sustrato:{" "}
            {typeof batch.crecimientoSustrato.tipoSustratoId === "object"
              ? batch.crecimientoSustrato.tipoSustratoId.nombre
              : "—"}
          </>
        )}
      </p>

      {siguienteEtapa && (
        <StageAdvanceSheet
          open={advanceOpen}
          onOpenChange={setAdvanceOpen}
          batchId={batch._id}
          targetStage={
            siguienteEtapa.target as Exclude<BatchEstado, "inoculacion_grano" | "descartado">
          }
          fungusType={batch.fungusTypeId}
          onSuccess={cargar}
        />
      )}
    </div>
  );
}
