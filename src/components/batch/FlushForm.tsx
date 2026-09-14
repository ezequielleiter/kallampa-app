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
import type { Batch, Oleada } from "@/lib/types";
import { addFlushSchema, type AddFlushInput } from "@/lib/validations/batch.schema";

interface FlushFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  flush?: Oleada;
  siguienteNumero: number;
  onSuccess: () => void;
}

// Se remonta (via `key` en el padre) cada vez que cambia el target de
// edicion, asi los `defaultValue` de los inputs no controlados se aplican
// de nuevo con los datos correctos.
export function FlushFormDialog({
  open,
  onOpenChange,
  batchId,
  flush,
  siguienteNumero,
  onSuccess,
}: FlushFormDialogProps) {
  const isEdit = !!flush;
  const fechaDefault = flush?.fecha
    ? flush.fecha.slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(addFlushSchema),
    defaultValues: {
      numero: flush?.numero ?? siguienteNumero,
      pesoKg: flush?.pesoKg,
      notas: flush?.notas ?? "",
    },
  });

  async function onSubmit(data: AddFlushInput) {
    try {
      if (isEdit && flush) {
        await apiFetch<Batch>(`/api/batches/${batchId}/flushes/${flush._id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        toast.success("Oleada actualizada");
      } else {
        await apiFetch<Batch>(`/api/batches/${batchId}/flushes`, {
          method: "POST",
          body: JSON.stringify(data),
        });
        toast.success("Oleada agregada");
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la oleada");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar oleada" : "Agregar oleada"}</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-1.5">
            <Label>Número de oleada</Label>
            <Input
              type="number"
              {...register("numero", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
            />
            {errors.numero && (
              <p className="text-xs text-destructive">{errors.numero.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Fecha</Label>
            <Input type="date" defaultValue={fechaDefault} {...register("fecha")} />
            {errors.fecha && (
              <p className="text-xs text-destructive">{errors.fecha.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Peso cosechado (kg)</Label>
            <Input
              type="number"
              step="any"
              {...register("pesoKg", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
            />
            {errors.pesoKg && (
              <p className="text-xs text-destructive">{errors.pesoKg.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Notas (opcional)</Label>
            <Textarea {...register("notas")} />
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
