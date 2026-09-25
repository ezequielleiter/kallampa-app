"use client";

import { useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { TrashIcon } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/kallampa/Field";
import { SegmentedControl } from "@/components/kallampa/SegmentedControl";
import { apiFetch } from "@/lib/api-client";
import type { Tarea } from "@/lib/types";
import { TAREA_ESTADOS } from "@/lib/constants";

// Schema LOCAL, no importado de `src/lib/validations/tarea.schema.ts` (que
// sí tiene el shape equivalente): ese archivo importa `TAREA_ESTADOS` desde
// `@/models/Tarea` para re-exportarlo, y cualquier import de ese archivo
// desde un Client Component arrastraría mongoose entero al bundle del
// navegador (rompe `next build`) -- mismo criterio ya documentado en
// NuevoRecipienteSheet.tsx / clonacion/nueva/page.tsx. `TAREA_ESTADOS` acá
// viene de `@/lib/constants`, el espejo client-safe del enum del modelo.
const tareaFormSchema = z.object({
  titulo: z.string().trim().min(1, "El título es requerido"),
  descripcion: z.string().optional().default(""),
  fecha: z.coerce.date(),
  estado: z.enum(TAREA_ESTADOS).optional().default("pendiente"),
});
type TareaFormInput = z.infer<typeof tareaFormSchema>;

interface TareaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarea?: Tarea | null;
  fechaInicial?: string | null;
  onSuccess: () => void;
  onDeleted?: () => void;
}

// Este dialogo se monta con `key` distinta por cada tarea/fecha (ver
// src/app/calendario/page.tsx), asi que los `defaultValues` de abajo
// siempre corresponden a la instancia actual -- no hace falta un
// `reset()` reactivo a cambios de props.
export function TareaFormDialog({
  open,
  onOpenChange,
  tarea,
  fechaInicial,
  onSuccess,
  onDeleted,
}: TareaFormDialogProps) {
  const t = useTranslations("components.tareaFormDialog");
  const tEstado = useTranslations("estados.tarea");
  const isEdit = !!tarea;
  const [borrarOpen, setBorrarOpen] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TareaFormInput>({
    // En edición, todos los campos son opcionales (equivalente a
    // `updateTareaSchema`); en creación, `titulo`/`fecha` son requeridos.
    // El cast es necesario porque TS no unifica el tipo de resolver de dos
    // instancias de ZodObject distintas (`tareaFormSchema` vs su
    // `.partial()`) a través del ternario.
    resolver: zodResolver(
      isEdit ? tareaFormSchema.partial() : tareaFormSchema
    ) as Resolver<TareaFormInput>,
    defaultValues: {
      titulo: tarea?.titulo ?? "",
      descripcion: tarea?.descripcion ?? "",
      estado: tarea?.estado ?? "pendiente",
    },
  });

  async function onSubmit(data: TareaFormInput) {
    try {
      if (isEdit && tarea) {
        await apiFetch(`/api/tareas/${tarea._id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        toast.success(t("updatedMessage"));
      } else {
        await apiFetch("/api/tareas", {
          method: "POST",
          body: JSON.stringify(data),
        });
        toast.success(t("createdMessage"));
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saveErrorMessage"));
    }
  }

  async function handleBorrar() {
    if (!tarea) return;
    setBorrando(true);
    try {
      await apiFetch(`/api/tareas/${tarea._id}`, { method: "DELETE" });
      toast.success(t("deletedMessage"));
      setBorrarOpen(false);
      onOpenChange(false);
      onDeleted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("deleteErrorMessage"));
    } finally {
      setBorrando(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEdit ? t("editTitle") : t("newTitle")}</DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-3.5" onSubmit={handleSubmit(onSubmit)}>
            <Field label={t("titulo")} error={errors.titulo?.message}>
              <Input {...register("titulo")} aria-invalid={errors.titulo ? true : undefined} />
            </Field>
            <Field label={t("descripcion")}>
              <Textarea {...register("descripcion")} />
            </Field>
            <Field label={t("fecha")} error={errors.fecha?.message}>
              <Input
                type="date"
                defaultValue={tarea ? tarea.fecha.slice(0, 10) : fechaInicial ?? ""}
                {...register("fecha")}
              />
            </Field>
            {isEdit && (
              <Field label={t("estado")}>
                <Controller
                  control={control}
                  name="estado"
                  render={({ field }) => (
                    <SegmentedControl
                      aria-label={t("estado")}
                      value={field.value ?? "pendiente"}
                      onChange={field.onChange}
                      options={TAREA_ESTADOS.map((e) => ({ value: e, label: tEstado(e) }))}
                    />
                  )}
                />
              </Field>
            )}

            <DialogFooter className="sm:justify-between">
              {isEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-danger-text hover:bg-danger-bg"
                  onClick={() => setBorrarOpen(true)}
                >
                  <TrashIcon /> {t("eliminar")}
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t("cancelar")}
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  {t("guardar")}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isEdit && (
        <AlertDialog open={borrarOpen} onOpenChange={setBorrarOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteTitle", { titulo: tarea?.titulo ?? "" })}</AlertDialogTitle>
              <AlertDialogDescription>{t("deleteDescription")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancelar")}</AlertDialogCancel>
              <AlertDialogAction variant="destructive" loading={borrando} onClick={handleBorrar}>
                {t("eliminar")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
