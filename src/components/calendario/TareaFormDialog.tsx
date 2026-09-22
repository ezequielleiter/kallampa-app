"use client";

import { useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEdit ? t("editTitle") : t("newTitle")}</DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-1.5">
              <Label>{t("titulo")}</Label>
              <Input {...register("titulo")} />
              {errors.titulo && (
                <p className="text-xs text-destructive">{errors.titulo.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("descripcion")}</Label>
              <Textarea {...register("descripcion")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("fecha")}</Label>
              <Input
                type="date"
                defaultValue={tarea ? tarea.fecha.slice(0, 10) : fechaInicial ?? ""}
                {...register("fecha")}
              />
              {errors.fecha && (
                <p className="text-xs text-destructive">{errors.fecha.message}</p>
              )}
            </div>
            {isEdit && (
              <div className="flex flex-col gap-1.5">
                <Label>{t("estado")}</Label>
                <Controller
                  control={control}
                  name="estado"
                  render={({ field }) => (
                    <Select
                      items={TAREA_ESTADOS.map((e) => ({
                        label: tEstado(e),
                        value: e,
                      }))}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TAREA_ESTADOS.map((e) => (
                          <SelectItem key={e} value={e}>
                            {tEstado(e)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            <DialogFooter className="sm:justify-between">
              {isEdit ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setBorrarOpen(true)}
                >
                  <Trash2 /> {t("eliminar")}
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t("cancelar")}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
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
              <AlertDialogAction variant="destructive" disabled={borrando} onClick={handleBorrar}>
                {t("eliminar")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
