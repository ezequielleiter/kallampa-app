"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api-client";
import { RECIPIENTE_ESTADO_LABELS, type RecipienteEstado } from "@/lib/constants";
import type { Recipiente } from "@/lib/types";

interface RecipienteEstadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipienteId: string;
  numeroSeguimiento: string;
  estadoObjetivo: Extract<RecipienteEstado, "finalizado" | "contaminado" | "descartado">;
  onSuccess: () => void;
}

const DESCRIPCIONES: Record<RecipienteEstadoDialogProps["estadoObjetivo"], string> = {
  finalizado: "Se cierra el recipiente: ya no va a dar más cosecha.",
  contaminado: "Se marca el recipiente como perdido por contaminación. Esta acción no se puede deshacer.",
  descartado: "Se marca el recipiente como descartado. Esta acción no se puede deshacer.",
};

export function RecipienteEstadoDialog({
  open,
  onOpenChange,
  recipienteId,
  numeroSeguimiento,
  estadoObjetivo,
  onSuccess,
}: RecipienteEstadoDialogProps) {
  const [motivo, setMotivo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await apiFetch<Recipiente>(`/api/recipientes/${recipienteId}/estado`, {
        method: "POST",
        body: JSON.stringify({ estado: estadoObjetivo, motivo: motivo.trim() || undefined }),
      });
      toast.success(`Recipiente ${RECIPIENTE_ESTADO_LABELS[estadoObjetivo].toLowerCase()}`);
      setMotivo("");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar el recipiente");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {RECIPIENTE_ESTADO_LABELS[estadoObjetivo]} — {numeroSeguimiento}
          </AlertDialogTitle>
          <AlertDialogDescription>{DESCRIPCIONES[estadoObjetivo]}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label>Motivo (opcional)</Label>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: contaminación por Trichoderma"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={submitting} onClick={handleConfirm}>
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
