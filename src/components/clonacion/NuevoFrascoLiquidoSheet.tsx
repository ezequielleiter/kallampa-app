"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api-client";
import type { FrascoLiquido, Placa } from "@/lib/types";

// Schema LOCAL, no importado de `src/lib/validations/clonacion.schema.ts`
// (mismo motivo que en `NuevoRecipienteSheet.tsx`: ese archivo importa
// `@/models/**` para re-exportar los enums, y arrastraría mongoose al
// bundle del navegador). Mismo shape que `createFrascoLiquidoSchema`.
const nuevoFrascoLiquidoSchema = z.object({
  origenPlacaId: z.string().min(1, "Elegí una placa de origen"),
  fechaCreacion: z.coerce.date(),
});
type NuevoFrascoLiquidoInput = z.infer<typeof nuevoFrascoLiquidoSchema>;

interface NuevoFrascoLiquidoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clonacionId: string;
  onSuccess: () => void;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function NuevoFrascoLiquidoSheet({
  open,
  onOpenChange,
  clonacionId,
  onSuccess,
}: NuevoFrascoLiquidoSheetProps) {
  const [placasDisponibles, setPlacasDisponibles] = useState<Placa[]>([]);
  const [loadingPlacas, setLoadingPlacas] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(nuevoFrascoLiquidoSchema),
  });

  useEffect(() => {
    if (!open) return;
    void Promise.resolve().then(() => {
      reset({ origenPlacaId: undefined });
      setLoadingPlacas(true);
      // Placas ya usadas para otros frascos líquidos también se muestran:
      // una placa colonizada no se consume y se puede reusar libremente.
      apiFetch<Placa[]>(`/api/placas?clonacionId=${clonacionId}&estado=colonizado`)
        .then(setPlacasDisponibles)
        .catch((err) =>
          toast.error(err instanceof Error ? err.message : "No se pudieron cargar las placas")
        )
        .finally(() => setLoadingPlacas(false));
    });
  }, [open, clonacionId, reset]);

  async function onSubmit(data: NuevoFrascoLiquidoInput) {
    try {
      await apiFetch<FrascoLiquido>("/api/frascos-liquidos", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast.success("Frasco de micelio líquido creado");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear el frasco líquido");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Nuevo frasco de micelio líquido</SheetTitle>
          <SheetDescription>
            Elegí la placa colonizada de origen. Una misma placa se puede usar para crear varios
            frascos: no se consume.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex flex-col gap-1.5">
            <Label>Placa de origen</Label>
            <Controller
              control={control}
              name="origenPlacaId"
              render={({ field }) => (
                <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-md border p-1">
                  {loadingPlacas ? (
                    <p className="p-3 text-center text-sm text-muted-foreground">Cargando…</p>
                  ) : placasDisponibles.length === 0 ? (
                    <p className="p-3 text-center text-sm text-muted-foreground">
                      No hay placas colonizadas disponibles.
                    </p>
                  ) : (
                    placasDisponibles.map((placa) => {
                      const selected = field.value === placa._id;
                      return (
                        <button
                          key={placa._id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => field.onChange(placa._id)}
                          className={`flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors ${
                            selected ? "bg-accent" : "hover:bg-muted"
                          }`}
                        >
                          <span className="flex size-4 shrink-0 items-center justify-center">
                            {selected && <Check className="size-4 text-primary" />}
                          </span>
                          <span>{placa.numeroPlaca}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            />
            {errors.origenPlacaId && (
              <p className="text-xs text-destructive">{errors.origenPlacaId.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Fecha de creación</Label>
            <Input
              type="date"
              defaultValue={todayInputValue()}
              {...register("fechaCreacion")}
            />
            {errors.fechaCreacion && (
              <p className="text-xs text-destructive">{errors.fechaCreacion.message}</p>
            )}
          </div>

          <SheetFooter className="px-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Crear frasco
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
