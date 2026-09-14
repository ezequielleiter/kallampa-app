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
import {
  catalogCreateSchema,
  type CatalogCreateInput,
} from "@/lib/validations/catalog.schema";

export interface CatalogItem {
  _id: string;
  nombre: string;
  notas?: string;
  activo: boolean;
}

interface CatalogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpoint: string;
  item?: CatalogItem;
  onSuccess: () => void;
}

// Crea o edita un registro de catalogo "simple" (GrainType / SubstrateType):
// {nombre, notas?, activo}. No hay DELETE fisico; activo se togglea desde la
// tabla, no desde este dialogo.
export function CatalogFormDialog({
  open,
  onOpenChange,
  endpoint,
  item,
  onSuccess,
}: CatalogFormDialogProps) {
  const isEdit = !!item;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CatalogCreateInput>({
    resolver: zodResolver(catalogCreateSchema),
    defaultValues: {
      nombre: item?.nombre ?? "",
      notas: item?.notas ?? "",
    },
  });

  async function onSubmit(data: CatalogCreateInput) {
    try {
      if (isEdit && item) {
        await apiFetch(`${endpoint}/${item._id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        toast.success("Registro actualizado");
      } else {
        await apiFetch(endpoint, {
          method: "POST",
          body: JSON.stringify(data),
        });
        toast.success("Registro creado");
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar" : "Nuevo"} registro</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-1.5">
            <Label>Nombre</Label>
            <Input {...register("nombre")} />
            {errors.nombre && (
              <p className="text-xs text-destructive">{errors.nombre.message}</p>
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
