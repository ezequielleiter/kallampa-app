"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldWarning } from "@/components/kallampa/Field";
import { apiFetch } from "@/lib/api-client";
import type { Batch, BatchDetail, FungusType } from "@/lib/types";

// Schema local (ver nota en NuevoRecipienteSheet.tsx sobre por que no se
// reusa `src/lib/validations/*` desde el cliente).
function buildSchema(msg: { hongo: string; fecha: string }) {
  return z.object({
    fungusTypeId: z.string(msg.hongo).min(1, msg.hongo),
    // String "YYYY-MM-DD" del input date; el server lo convierte a Date.
    fechaInicio: z.string(msg.fecha).min(1, msg.fecha),
  });
}
type EditarLoteInput = z.infer<ReturnType<typeof buildSchema>>;

/** Prefijo de iniciales del numeroLote ("GI-L-2026-001" -> "GI-"). */
function conIniciales(numeroLote: string, iniciales?: string) {
  const base = numeroLote.replace(/^[A-Z]{1,4}-(?=L-)/, "");
  return iniciales ? `${iniciales}-${base}` : base;
}

interface EditarLoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: BatchDetail;
  onSuccess: () => void;
}

export function EditarLoteDialog({ open, onOpenChange, batch, onSuccess }: EditarLoteDialogProps) {
  const t = useTranslations("components.editarLoteDialog");
  const tCommon = useTranslations("common");
  const [fungusTypes, setFungusTypes] = useState<FungusType[]>([]);
  const desdeFrascoLiquido = !!batch.origenFrascoLiquidoId;

  useEffect(() => {
    if (!open || fungusTypes.length > 0) return;
    apiFetch<FungusType[]>("/api/fungus-types?activo=true")
      .then(setFungusTypes)
      .catch(() => toast.error(t("loadHongosError")));
  }, [open, fungusTypes.length, t]);

  // El hongo actual puede estar inactivo: se suma a la lista para que el
  // Select lo pueda mostrar.
  const opciones = useMemo(() => {
    const actual = batch.fungusTypeId;
    return actual && !fungusTypes.some((f) => f._id === actual._id)
      ? [actual, ...fungusTypes]
      : fungusTypes;
  }, [fungusTypes, batch.fungusTypeId]);

  const schema = useMemo(
    () => buildSchema({ hongo: t("errorHongo"), fecha: t("errorFecha") }),
    [t]
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    values: {
      fungusTypeId: batch.fungusTypeId?._id ?? "",
      fechaInicio: batch.inoculacionGrano.fechaInicio.slice(0, 10),
    },
  });

  const fungusTypeId = useWatch({ control, name: "fungusTypeId" });
  const hongoElegido = opciones.find((f) => f._id === fungusTypeId);
  const numeroNuevo =
    hongoElegido && hongoElegido._id !== batch.fungusTypeId?._id
      ? conIniciales(batch.numeroLote, hongoElegido.iniciales)
      : batch.numeroLote;

  async function onSubmit(data: EditarLoteInput) {
    try {
      const actualizado = await apiFetch<Batch>(`/api/batches/${batch._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...(data.fungusTypeId !== batch.fungusTypeId?._id
            ? { fungusTypeId: data.fungusTypeId }
            : {}),
          fechaInicio: data.fechaInicio,
        }),
      });
      toast.success(t("successMessage", { numeroLote: actualizado.numeroLote }));
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorMessage"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form className="contents" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{batch.numeroLote}</DialogDescription>
          </DialogHeader>

          <Field
            label={t("tipoHongo")}
            hint={desdeFrascoLiquido ? t("hongoDesdeFrascoLiquido") : undefined}
            error={errors.fungusTypeId?.message}
          >
            <Controller
              control={control}
              name="fungusTypeId"
              render={({ field }) => (
                <Select
                  items={opciones.map((f) => ({ label: f.nombre, value: f._id }))}
                  value={field.value || null}
                  onValueChange={field.onChange}
                  disabled={desdeFrascoLiquido}
                >
                  <SelectTrigger className="w-full" aria-invalid={!!errors.fungusTypeId}>
                    <SelectValue placeholder={t("elegirHongo")} />
                  </SelectTrigger>
                  <SelectContent>
                    {opciones.map((f) => (
                      <SelectItem key={f._id} value={f._id}>
                        {f.nombre}
                        {f.nombreCientifico && (
                          <span className="text-text-subtle italic">{f.nombreCientifico}</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          {numeroNuevo !== batch.numeroLote && (
            <FieldWarning>{t("renombreWarning", { numeroLote: numeroNuevo })}</FieldWarning>
          )}

          <Field label={t("fechaInoculacion")} error={errors.fechaInicio?.message}>
            <Input type="date" {...register("fechaInicio")} />
          </Field>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              {tCommon("cancel")}
            </DialogClose>
            <Button type="submit" loading={isSubmitting}>
              {t("guardar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
