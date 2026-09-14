"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api-client";
import type { Batch } from "@/lib/types";

interface DiscardDialogProps {
  batchId: string;
  onSuccess: () => void;
}

export function DiscardDialog({ batchId, onSuccess }: DiscardDialogProps) {
  const [motivo, setMotivo] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const motivoValido = motivo.trim().length >= 3;

  async function handleConfirm() {
    if (!motivoValido) return;
    setSubmitting(true);
    try {
      await apiFetch<Batch>(`/api/batches/${batchId}/discard`, {
        method: "POST",
        body: JSON.stringify({ motivo }),
      });
      toast.success("Lote descartado");
      setOpen(false);
      setMotivo("");
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo descartar el lote");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Descartar lote
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Descartar lote</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción marca el lote como descartado y no se puede deshacer. Indicá el motivo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label>Motivo</Label>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: contaminación generalizada"
          />
          {!motivoValido && motivo.length > 0 && (
            <p className="text-xs text-destructive">Mínimo 3 caracteres.</p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!motivoValido || submitting}
            onClick={handleConfirm}
          >
            Confirmar descarte
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
