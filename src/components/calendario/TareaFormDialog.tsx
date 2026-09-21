"use client";

import { useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { TAREA_ESTADOS, TAREA_ESTADO_LABELS } from "@/lib/constants";

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
        toast.success("Tarea actualizada");
      } else {
        await apiFetch("/api/tareas", {
          method: "POST",
          body: JSON.stringify(data),
        });
        toast.success("Tarea creada");
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la tarea");
    }
  }

  async function handleBorrar() {
    if (!tarea) return;
    setBorrando(true);
    try {
      await apiFetch(`/api/tareas/${tarea._id}`, { method: "DELETE" });
      toast.success("Tarea eliminada");
      setBorrarOpen(false);
      onOpenChange(false);
      onDeleted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar la tarea");
    } finally {
      setBorrando(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-1.5">
              <Label>Título</Label>
              <Input {...register("titulo")} />
              {errors.titulo && (
                <p className="text-xs text-destructive">{errors.titulo.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Descripción (opcional)</Label>
              <Textarea {...register("descripcion")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Fecha</Label>
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
                <Label>Estado</Label>
                <Controller
                  control={control}
                  name="estado"
                  render={({ field }) => (
                    <Select
                      items={TAREA_ESTADOS.map((e) => ({
                        label: TAREA_ESTADO_LABELS[e],
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
                            {TAREA_ESTADO_LABELS[e]}
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
                  <Trash2 /> Eliminar
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  Guardar
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
              <AlertDialogTitle>Eliminar &ldquo;{tarea?.titulo}&rdquo;</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer: la tarea se borra por completo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction variant="destructive" disabled={borrando} onClick={handleBorrar}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
