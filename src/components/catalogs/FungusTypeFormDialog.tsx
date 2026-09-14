"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api-client";
import type { FungusType } from "@/lib/types";
import {
  fungusTypeCreateSchema,
  type FungusTypeCreateInput,
} from "@/lib/validations/catalog.schema";

interface FungusTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fungusType?: FungusType;
  onSuccess: () => void;
}

export function FungusTypeFormDialog({
  open,
  onOpenChange,
  fungusType,
  onSuccess,
}: FungusTypeFormDialogProps) {
  const isEdit = !!fungusType;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FungusTypeCreateInput>({
    resolver: zodResolver(fungusTypeCreateSchema),
    defaultValues: {
      nombre: fungusType?.nombre ?? "",
      nombreCientifico: fungusType?.nombreCientifico ?? "",
      notas: fungusType?.notas ?? "",
      diasEsperadosDefault: {
        inoculacionGrano: fungusType?.diasEsperadosDefault.inoculacionGrano ?? 14,
        crecimientoSustrato: fungusType?.diasEsperadosDefault.crecimientoSustrato ?? 14,
        fructificacion: fungusType?.diasEsperadosDefault.fructificacion ?? 14,
        cosecha: fungusType?.diasEsperadosDefault.cosecha ?? 7,
      },
    },
  });

  async function onSubmit(data: FungusTypeCreateInput) {
    try {
      if (isEdit && fungusType) {
        await apiFetch(`/api/fungus-types/${fungusType._id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        toast.success("Tipo de hongo actualizado");
      } else {
        await apiFetch("/api/fungus-types", {
          method: "POST",
          body: JSON.stringify(data),
        });
        toast.success("Tipo de hongo creado");
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar" : "Nuevo"} tipo de hongo</DialogTitle>
        </DialogHeader>
        <form className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-1.5">
            <Label>Nombre</Label>
            <Input {...register("nombre")} />
            {errors.nombre && (
              <p className="text-xs text-destructive">{errors.nombre.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Nombre científico (opcional)</Label>
            <Input {...register("nombreCientifico")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Notas (opcional)</Label>
            <Textarea {...register("notas")} />
          </div>

          <p className="text-xs font-medium text-muted-foreground">
            Días esperados por defecto en cada etapa
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Inoculación en grano</Label>
              <Input
                type="number"
                {...register("diasEsperadosDefault.inoculacionGrano", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
              {errors.diasEsperadosDefault?.inoculacionGrano && (
                <p className="text-xs text-destructive">
                  {errors.diasEsperadosDefault.inoculacionGrano.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Crecimiento en sustrato</Label>
              <Input
                type="number"
                {...register("diasEsperadosDefault.crecimientoSustrato", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
              {errors.diasEsperadosDefault?.crecimientoSustrato && (
                <p className="text-xs text-destructive">
                  {errors.diasEsperadosDefault.crecimientoSustrato.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Fructificación</Label>
              <Input
                type="number"
                {...register("diasEsperadosDefault.fructificacion", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
              {errors.diasEsperadosDefault?.fructificacion && (
                <p className="text-xs text-destructive">
                  {errors.diasEsperadosDefault.fructificacion.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Cosecha</Label>
              <Input
                type="number"
                {...register("diasEsperadosDefault.cosecha", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
              {errors.diasEsperadosDefault?.cosecha && (
                <p className="text-xs text-destructive">
                  {errors.diasEsperadosDefault.cosecha.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
