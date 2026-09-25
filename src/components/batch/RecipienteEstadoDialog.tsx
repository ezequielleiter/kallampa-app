"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
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
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/kallampa/Field";
import { apiFetch } from "@/lib/api-client";
import type { RecipienteEstado } from "@/lib/constants";
import type { Recipiente } from "@/lib/types";
import { codigoCorto } from "./lote-view";

interface RecipienteEstadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipienteId: string;
  numeroSeguimiento: string;
  estadoObjetivo: Extract<RecipienteEstado, "finalizado" | "contaminado" | "descartado">;
  onSuccess: () => void;
}

const TITULO_KEYS: Record<RecipienteEstadoDialogProps["estadoObjetivo"], string> = {
  finalizado: "tituloFinalizado",
  contaminado: "tituloContaminado",
  descartado: "tituloDescartado",
};

const DESCRIPCION_KEYS: Record<RecipienteEstadoDialogProps["estadoObjetivo"], string> = {
  finalizado: "descripcionFinalizado",
  contaminado: "descripcionContaminado",
  descartado: "descripcionDescartado",
};

export function RecipienteEstadoDialog({
  open,
  onOpenChange,
  recipienteId,
  numeroSeguimiento,
  estadoObjetivo,
  onSuccess,
}: RecipienteEstadoDialogProps) {
  const t = useTranslations("components.recipienteEstadoDialog");
  const tEstado = useTranslations("estados.recipiente");
  const [motivo, setMotivo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await apiFetch<Recipiente>(`/api/recipientes/${recipienteId}/estado`, {
        method: "POST",
        body: JSON.stringify({ estado: estadoObjetivo, motivo: motivo.trim() || undefined }),
      });
      toast.success(
        t("successMessage", {
          codigo: codigoCorto(numeroSeguimiento),
          estado: tEstado(estadoObjetivo).toLowerCase(),
        })
      );
      setMotivo("");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorMessage"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t(TITULO_KEYS[estadoObjetivo])}</AlertDialogTitle>
          <div className="text-[12.5px] text-text-muted tabular-nums">{numeroSeguimiento}</div>
          <AlertDialogDescription>{t(DESCRIPCION_KEYS[estadoObjetivo])}</AlertDialogDescription>
        </AlertDialogHeader>
        <Field label={t("motivo")} optional>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder={t("motivoPlaceholder")}
          />
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancelar")}</AlertDialogCancel>
          <AlertDialogAction
            variant={estadoObjetivo === "finalizado" ? "default" : "destructive"}
            loading={submitting}
            onClick={handleConfirm}
          >
            {t("confirmar")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
