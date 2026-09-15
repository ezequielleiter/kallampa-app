"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import type { Clonacion, FungusType, JarDetail, RecipienteDetail } from "@/lib/types";

// Schema LOCAL, no importado de `src/lib/validations/clonacion.schema.ts`
// (que ya tiene el shape equivalente, `createClonacionSchema`): ese archivo
// importa `PLACA_ESTADOS`/`FRASCO_LIQUIDO_ESTADOS` desde `@/models/**` para
// re-exportarlos, y cualquier import desde un Client Component arrastraría
// mongoose entero al bundle del navegador (rompe `next build`). Mismo shape
// que el backend documenta en `createClonacionSchema`: exactamente una de
// `fungusTypeId` / `origenJarId` / `origenRecipienteId`, validado acá con
// `refine` porque el shape exacto ya lo elige `origen` en tiempo de submit
// (ver `onSubmit`), no el formulario en sí.
const nuevaClonacionSchema = z.object({
  fungusTypeId: z.string().optional(),
  cantidadPlacas: z.number().int().positive(),
  fechaInicio: z.coerce.date(),
  diasEsperados: z.number().positive().optional(),
});
type NuevaClonacionInput = z.infer<typeof nuevaClonacionSchema>;

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

type Origen =
  | { tipo: "ninguno" }
  | { tipo: "jar"; jar: JarDetail }
  | { tipo: "recipiente"; recipiente: RecipienteDetail };

export default function NuevaClonacionPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-muted-foreground">Cargando…</p>}>
      <NuevaClonacionForm />
    </Suspense>
  );
}

function NuevaClonacionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const origenJarId = searchParams.get("origenJarId");
  const origenRecipienteId = searchParams.get("origenRecipienteId");

  const [fungusTypes, setFungusTypes] = useState<FungusType[]>([]);
  const [origen, setOrigen] = useState<Origen>({ tipo: "ninguno" });
  const [loadingOrigen, setLoadingOrigen] = useState(!!(origenJarId || origenRecipienteId));

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

  // Si la URL trae un origen (frasco de grano colonizado/usado, o
  // recipiente fructificando), lo cargamos para fijar el hongo y prellenar
  // días esperados. Si el fetch falla (id inexistente, etc), avisamos y
  // dejamos caer al formulario normal con selector de hongo — no rompe la
  // pantalla.
  useEffect(() => {
    if (!origenJarId && !origenRecipienteId) return;
    let cancelado = false;

    async function cargarOrigen() {
      try {
        if (origenJarId) {
          const jar = await apiFetch<JarDetail>(`/api/jars/${origenJarId}`);
          if (cancelado) return;
          setOrigen({ tipo: "jar", jar });
          const dias = jar.batch.fungusTypeId?.diasEsperadosDefault?.colonizacionPlacas;
          if (dias) setValue("diasEsperados", dias);
        } else if (origenRecipienteId) {
          const recipiente = await apiFetch<RecipienteDetail>(
            `/api/recipientes/${origenRecipienteId}`
          );
          if (cancelado) return;
          setOrigen({ tipo: "recipiente", recipiente });
          const dias = recipiente.batch.fungusTypeId?.diasEsperadosDefault?.colonizacionPlacas;
          if (dias) setValue("diasEsperados", dias);
        }
      } catch (err) {
        if (cancelado) return;
        toast.error(
          err instanceof Error
            ? err.message
            : "No se pudo cargar el origen indicado, elegí el hongo manualmente"
        );
        setOrigen({ tipo: "ninguno" });
      } finally {
        if (!cancelado) setLoadingOrigen(false);
      }
    }

    void cargarOrigen();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origenJarId, origenRecipienteId]);

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
    if (origen.tipo === "ninguno" && !data.fungusTypeId) {
      toast.error("Elegí un tipo de hongo");
      return;
    }

    const body: Record<string, unknown> = {
      cantidadPlacas: data.cantidadPlacas,
      fechaInicio: data.fechaInicio,
      diasEsperados: data.diasEsperados,
    };
    if (origen.tipo === "jar") {
      body.origenJarId = origen.jar._id;
    } else if (origen.tipo === "recipiente") {
      body.origenRecipienteId = origen.recipiente._id;
    } else {
      body.fungusTypeId = data.fungusTypeId;
    }

    try {
      const clonacion = await apiFetch<Clonacion>("/api/clonaciones", {
        method: "POST",
        body: JSON.stringify(body),
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
              {loadingOrigen ? (
                <p className="text-sm text-muted-foreground">Cargando origen…</p>
              ) : origen.tipo === "jar" ? (
                <>
                  <p className="text-sm font-medium">{origen.jar.batch.fungusTypeId?.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    Se hereda del lote {origen.jar.batch.numeroLote} (
                    {origen.jar.numeroGuia})
                  </p>
                </>
              ) : origen.tipo === "recipiente" ? (
                <>
                  <p className="text-sm font-medium">
                    {origen.recipiente.batch.fungusTypeId?.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Se hereda del lote {origen.recipiente.batch.numeroLote} (
                    {origen.recipiente.numeroSeguimiento})
                  </p>
                </>
              ) : (
                <Controller
                  control={control}
                  name="fungusTypeId"
                  render={({ field }) => (
                    <Select
                      items={fungusTypes.map((f) => ({ label: f.nombre, value: f._id }))}
                      value={field.value ?? null}
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
              )}
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
