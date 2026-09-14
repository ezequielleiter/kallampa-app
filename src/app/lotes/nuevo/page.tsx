"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import type { FungusType, GrainType, BatchWithJars } from "@/lib/types";
import {
  createBatchSchema,
  type CreateBatchInput,
} from "@/lib/validations/batch.schema";

export default function NuevoLotePage() {
  const router = useRouter();
  const [fungusTypes, setFungusTypes] = useState<FungusType[]>([]);
  const [grainTypes, setGrainTypes] = useState<GrainType[]>([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createBatchSchema),
  });

  useEffect(() => {
    apiFetch<FungusType[]>("/api/fungus-types?activo=true").then(setFungusTypes);
    apiFetch<GrainType[]>("/api/grain-types?activo=true").then(setGrainTypes);
  }, []);

  function handleFungusChange(id: string | null, onChange: (v: string | null) => void) {
    onChange(id);
    const fungusType = fungusTypes.find((f) => f._id === id);
    if (fungusType) {
      setValue("diasEsperados", fungusType.diasEsperadosDefault.inoculacionGrano);
    }
  }

  async function onSubmit(data: CreateBatchInput) {
    try {
      const batch = await apiFetch<BatchWithJars>("/api/batches", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast.success(`Lote ${batch.numeroLote} creado`);
      router.push(`/lotes/${batch._id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear el lote");
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">Nuevo lote</h1>
      <Card>
        <CardHeader>
          <CardTitle>Datos de inoculación en grano</CardTitle>
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
              <Label>Tipo de grano</Label>
              <Controller
                control={control}
                name="tipoGranoId"
                render={({ field }) => (
                  <Select
                    items={grainTypes.map((g) => ({ label: g.nombre, value: g._id }))}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Elegí un grano" />
                    </SelectTrigger>
                    <SelectContent>
                      {grainTypes.map((g) => (
                        <SelectItem key={g._id} value={g._id}>
                          {g.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.tipoGranoId && (
                <p className="text-xs text-destructive">{errors.tipoGranoId.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Peso de grano (kg)</Label>
              <Input
                type="number"
                step="any"
                {...register("pesoGranoKg", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
              {errors.pesoGranoKg && (
                <p className="text-xs text-destructive">{errors.pesoGranoKg.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Precio por kg</Label>
              <Input
                type="number"
                step="any"
                {...register("precioPorKg", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
              {errors.precioPorKg && (
                <p className="text-xs text-destructive">{errors.precioPorKg.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Cantidad de frascos</Label>
              <Input
                type="number"
                {...register("cantidadFrascos", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
              {errors.cantidadFrascos && (
                <p className="text-xs text-destructive">{errors.cantidadFrascos.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Fecha de inoculación</Label>
              <Input
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                {...register("fechaInicio")}
              />
              {errors.fechaInicio && (
                <p className="text-xs text-destructive">{errors.fechaInicio.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Días esperados en esta etapa</Label>
              <Input
                type="number"
                {...register("diasEsperados", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
              {errors.diasEsperados && (
                <p className="text-xs text-destructive">{errors.diasEsperados.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push("/")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Crear lote
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
