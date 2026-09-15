"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import type { Clonacion, FungusType } from "@/lib/types";

// Schema LOCAL, no importado de `src/lib/validations/clonacion.schema.ts`
// (que ya tiene el shape equivalente, `createClonacionSchema`): ese archivo
// importa `PLACA_ESTADOS`/`FRASCO_LIQUIDO_ESTADOS` desde `@/models/**` para
// re-exportarlos, y cualquier import desde un Client Component arrastraría
// mongoose entero al bundle del navegador (rompe `next build`). Mismo
// shape que el backend documenta en `createClonacionSchema`.
const nuevaClonacionSchema = z.object({
  fungusTypeId: z.string().min(1, "Id requerido"),
  cantidadPlacas: z.number().int().positive(),
  fechaInicio: z.coerce.date(),
  diasEsperados: z.number().positive().optional(),
});
type NuevaClonacionInput = z.infer<typeof nuevaClonacionSchema>;

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function NuevaClonacionPage() {
  const router = useRouter();
  const [fungusTypes, setFungusTypes] = useState<FungusType[]>([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(nuevaClonacionSchema),
  });

  useEffect(() => {
    apiFetch<FungusType[]>("/api/fungus-types?activo=true").then(setFungusTypes);
  }, []);

  function handleFungusChange(id: string | null, onChange: (v: string | null) => void) {
    onChange(id);
    const fungusType = fungusTypes.find((f) => f._id === id);
    // Prefill solo si el hongo tiene el campo cargado — hongos viejos pueden
    // no tenerlo, en ese caso dejamos el campo vacío y editable.
    if (fungusType?.diasEsperadosDefault.colonizacionPlacas) {
      setValue("diasEsperados", fungusType.diasEsperadosDefault.colonizacionPlacas);
    }
  }

  async function onSubmit(data: NuevaClonacionInput) {
    try {
      const clonacion = await apiFetch<Clonacion>("/api/clonaciones", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast.success(`Clonación ${clonacion.numeroLote} creada`);
      router.push(`/clonacion/${clonacion._id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear la clonación");
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">Nueva clonación</h1>
      <Card>
        <CardHeader>
          <CardTitle>Datos de colonización de placas</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-1.5">
              <Label>Tipo de hongo</Label>
              <Controller
                control={control}
                name="fungusTypeId"
                render={({ field }) => (
                  <Select
                    items={fungusTypes.map((f) => ({ label: f.nombre, value: f._id }))}
                    value={field.value}
                    onValueChange={(v) => handleFungusChange(v, field.onChange)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Elegí un hongo" />
                    </SelectTrigger>
                    <SelectContent>
                      {fungusTypes.map((f) => (
                        <SelectItem key={f._id} value={f._id}>
                          {f.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.fungusTypeId && (
                <p className="text-xs text-destructive">{errors.fungusTypeId.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Cantidad de placas</Label>
              <Input
                type="number"
                {...register("cantidadPlacas", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
              {errors.cantidadPlacas && (
                <p className="text-xs text-destructive">{errors.cantidadPlacas.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Fecha de inicio</Label>
              <Input
                type="date"
                defaultValue={todayInputValue()}
                {...register("fechaInicio")}
              />
              {errors.fechaInicio && (
                <p className="text-xs text-destructive">{errors.fechaInicio.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Días esperados de colonización</Label>
              <Input
                type="number"
                {...register("diasEsperados", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
              <p className="text-xs text-muted-foreground">
                Si el hongo elegido no tiene un valor por defecto configurado, completalo acá.
              </p>
              {errors.diasEsperados && (
                <p className="text-xs text-destructive">{errors.diasEsperados.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push("/clonacion")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Crear clonación
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
