"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import type {
  BatchListItem,
  Clonacion,
  FungusType,
  Jar,
  JarDetail,
  RecipienteDetail,
} from "@/lib/types";

type OrigenProceso = "placa" | "comprado" | "frascoGrano";

// Schema LOCAL, no importado de `src/lib/validations/clonacion.schema.ts`
// (que ya tiene el shape equivalente, `createClonacionSchema`): ese archivo
// importa `PLACA_ESTADOS`/`FRASCO_LIQUIDO_ESTADOS` desde `@/models/**` para
// re-exportarlos, y cualquier import desde un Client Component arrastraría
// mongoose entero al bundle del navegador (rompe `next build`). Mismo shape
// que el backend documenta en `createClonacionSchema`, pero mas laxo: la
// validacion estricta de que es obligatorio segun `origenProceso` la hace el
// server; acá alcanza con no dejar mandar el form si falta algo obviamente
// necesario (mismos `toast.error` manuales que ya usaba este archivo).
const nuevaClonacionSchema = z.object({
  origenProceso: z.enum(["placa", "comprado", "frascoGrano"]).optional(),
  fungusTypeId: z.string().optional(),
  cantidadPlacas: z.number().int().positive().optional(),
  cantidadFrascos: z.number().int().positive().optional(),
  fechaInicio: z.coerce.date(),
  diasEsperados: z.number().positive().optional(),
  recetaAgar: z.string().trim().optional(),
});
type NuevaClonacionInput = z.infer<typeof nuevaClonacionSchema>;

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

type Origen =
  | { tipo: "ninguno" }
  | { tipo: "jar"; jar: JarDetail }
  | { tipo: "recipiente"; recipiente: RecipienteDetail };

function jarGranoLabel(jar: Jar, batchesById: Record<string, BatchListItem>): string {
  const batch = batchesById[jar.batchId];
  if (!batch) return jar.numeroGuia;
  return `${jar.numeroGuia} — ${batch.fungusTypeId?.nombre ?? "?"} (${batch.numeroLote})`;
}

export default function NuevaClonacionPage() {
  const t = useTranslations("pages.clonacionNueva");
  return (
    <Suspense fallback={<p className="p-4 text-sm text-muted-foreground">{t("loading")}</p>}>
      <NuevaClonacionForm />
    </Suspense>
  );
}

function NuevaClonacionForm() {
  const router = useRouter();
  const t = useTranslations("pages.clonacionNueva");
  const tOrigen = useTranslations("estados.origenProceso");
  const searchParams = useSearchParams();
  const origenJarId = searchParams.get("origenJarId");
  const origenRecipienteId = searchParams.get("origenRecipienteId");

  const [origenProceso, setOrigenProceso] = useState<OrigenProceso>("placa");
  const [fungusTypes, setFungusTypes] = useState<FungusType[]>([]);
  const [origen, setOrigen] = useState<Origen>({ tipo: "ninguno" });
  const [loadingOrigen, setLoadingOrigen] = useState(!!(origenJarId || origenRecipienteId));

  // Picker de Jar de grano colonizado/usado, solo para el camino
  // "frascoGrano". `GET /api/jars` no devuelve el batch poblado, así que
  // cruzamos con `GET /api/batches` en el cliente para poder mostrar
  // hongo/lote junto a cada Jar.
  const [jarsGrano, setJarsGrano] = useState<Jar[]>([]);
  const [batchesById, setBatchesById] = useState<Record<string, BatchListItem>>({});
  const [loadingJarsGrano, setLoadingJarsGrano] = useState(false);
  const [jarSeleccionado, setJarSeleccionado] = useState<Jar | null>(null);

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
  // pantalla. Solo aplica al camino "placa" (default con el que llega esta
  // pantalla desde los botones "Clonar").
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
        toast.error(err instanceof Error ? err.message : t("loadOrigenError"));
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

  // Camino "frascoGrano": traemos los Jars colonizados/usados + los batches
  // (para resolver hongo/lote en el cliente) recién cuando el usuario elige
  // este camino.
  useEffect(() => {
    if (origenProceso !== "frascoGrano") return;
    let cancelado = false;
    void Promise.resolve().then(() => {
      if (cancelado) return;
      setLoadingJarsGrano(true);
      Promise.all([
        apiFetch<Jar[]>("/api/jars?estado=colonizado,usado"),
        apiFetch<BatchListItem[]>("/api/batches"),
      ])
        .then(([jars, batches]) => {
          if (cancelado) return;
          setJarsGrano(jars);
          setBatchesById(Object.fromEntries(batches.map((b) => [b._id, b])));
        })
        .catch((err) => {
          if (cancelado) return;
          toast.error(err instanceof Error ? err.message : t("loadJarsError"));
        })
        .finally(() => {
          if (!cancelado) setLoadingJarsGrano(false);
        });
    });
    return () => {
      cancelado = true;
    };
  }, [origenProceso, t]);

  function handleOrigenProcesoChange(next: OrigenProceso) {
    setOrigenProceso(next);
    if (next !== "placa") {
      // El origen precargado por query param (?origenJarId=/?origenRecipienteId=)
      // solo aplica al camino "placa" — se descarta por completo en vez de
      // intentar trasladarlo al picker de "frascoGrano" (componente distinto).
      setOrigen({ tipo: "ninguno" });
      setLoadingOrigen(false);
    }
    if (next !== "frascoGrano") {
      setJarSeleccionado(null);
    }
  }

  function handleFungusChange(id: string | null, onChange: (v: string | null) => void) {
    onChange(id);
    if (origenProceso !== "placa") return;
    const fungusType = fungusTypes.find((f) => f._id === id);
    // Prefill solo si el hongo tiene el campo cargado — hongos viejos pueden
    // no tenerlo, en ese caso dejamos el campo vacío y editable.
    if (fungusType?.diasEsperadosDefault.colonizacionPlacas) {
      setValue("diasEsperados", fungusType.diasEsperadosDefault.colonizacionPlacas);
    }
  }

  async function onSubmit(data: NuevaClonacionInput) {
    if (origenProceso === "placa") {
      if (origen.tipo === "ninguno" && !data.fungusTypeId) {
        toast.error(t("chooseHongo"));
        return;
      }
      if (!data.cantidadPlacas) {
        toast.error(t("enterCantidadPlacas"));
        return;
      }

      const body: Record<string, unknown> = {
        cantidadPlacas: data.cantidadPlacas,
        fechaInicio: data.fechaInicio,
        diasEsperados: data.diasEsperados,
        recetaAgar: data.recetaAgar,
      };
      if (origen.tipo === "jar") {
        body.origenJarId = origen.jar._id;
      } else if (origen.tipo === "recipiente") {
        body.origenRecipienteId = origen.recipiente._id;
      } else {
        body.fungusTypeId = data.fungusTypeId;
      }

      await crearClonacion(body);
      return;
    }

    if (origenProceso === "comprado") {
      if (!data.fungusTypeId) {
        toast.error(t("chooseHongo"));
        return;
      }
      if (!data.cantidadFrascos) {
        toast.error(t("enterCantidadFrascos"));
        return;
      }

      await crearClonacion({
        origenProceso: "comprado",
        fungusTypeId: data.fungusTypeId,
        cantidadFrascos: data.cantidadFrascos,
        fechaInicio: data.fechaInicio,
      });
      return;
    }

    // frascoGrano
    if (!jarSeleccionado) {
      toast.error(t("chooseJarOrigen"));
      return;
    }
    if (!data.cantidadFrascos) {
      toast.error(t("enterCantidadFrascos"));
      return;
    }

    await crearClonacion({
      origenProceso: "frascoGrano",
      origenJarId: jarSeleccionado._id,
      cantidadFrascos: data.cantidadFrascos,
      fechaInicio: data.fechaInicio,
    });
  }

  async function crearClonacion(body: Record<string, unknown>) {
    try {
      const clonacion = await apiFetch<Clonacion>("/api/clonaciones", {
        method: "POST",
        body: JSON.stringify(body),
      });
      toast.success(t("createdSuccess", { numeroLote: clonacion.numeroLote }));
      router.push(`/clonacion/${clonacion._id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("createError"));
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">{t("title")}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t("cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-1.5">
              <Label>{t("origenProceso")}</Label>
              <div className="flex gap-2">
                {(["placa", "comprado", "frascoGrano"] as OrigenProceso[]).map((op) => (
                  <Button
                    key={op}
                    type="button"
                    size="sm"
                    variant={origenProceso === op ? "default" : "outline"}
                    onClick={() => handleOrigenProcesoChange(op)}
                  >
                    {tOrigen(op)}
                  </Button>
                ))}
              </div>
            </div>

            {origenProceso === "placa" && (
              <div className="flex flex-col gap-1.5">
                <Label>{t("tipoHongo")}</Label>
                {loadingOrigen ? (
                  <p className="text-sm text-muted-foreground">{t("loadingOrigen")}</p>
                ) : origen.tipo === "jar" ? (
                  <>
                    <p className="text-sm font-medium">{origen.jar.batch.fungusTypeId?.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("heredaDeLote", {
                        numeroLote: origen.jar.batch.numeroLote,
                        codigo: origen.jar.numeroGuia,
                      })}
                    </p>
                  </>
                ) : origen.tipo === "recipiente" ? (
                  <>
                    <p className="text-sm font-medium">
                      {origen.recipiente.batch.fungusTypeId?.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("heredaDeLote", {
                        numeroLote: origen.recipiente.batch.numeroLote,
                        codigo: origen.recipiente.numeroSeguimiento,
                      })}
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
                          <SelectValue placeholder={t("elegirHongo")} />
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
            )}

            {origenProceso === "comprado" && (
              <div className="flex flex-col gap-1.5">
                <Label>{t("tipoHongo")}</Label>
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
                        <SelectValue placeholder={t("elegirHongo")} />
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
            )}

            {origenProceso === "frascoGrano" && (
              <div className="flex flex-col gap-1.5">
                <Label>{t("frascoGranoOrigen")}</Label>
                <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-md border p-1">
                  {loadingJarsGrano ? (
                    <p className="p-3 text-center text-sm text-muted-foreground">
                      {t("loading")}
                    </p>
                  ) : jarsGrano.length === 0 ? (
                    <p className="p-3 text-center text-sm text-muted-foreground">
                      {t("noJarsGrano")}
                    </p>
                  ) : (
                    jarsGrano.map((jar) => {
                      const selected = jarSeleccionado?._id === jar._id;
                      return (
                        <button
                          key={jar._id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setJarSeleccionado(jar)}
                          className={`flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors ${
                            selected ? "bg-accent" : "hover:bg-muted"
                          }`}
                        >
                          <span className="flex size-4 shrink-0 items-center justify-center">
                            {selected && <Check className="size-4 text-primary" />}
                          </span>
                          <span>{jarGranoLabel(jar, batchesById)}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {origenProceso === "placa" && (
              <div className="flex flex-col gap-1.5">
                <Label>{t("cantidadPlacas")}</Label>
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
            )}

            {origenProceso !== "placa" && (
              <div className="flex flex-col gap-1.5">
                <Label>{t("cantidadFrascos")}</Label>
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
            )}

            <div className="flex flex-col gap-1.5">
              <Label>{t("fechaInicio")}</Label>
              <Input
                type="date"
                defaultValue={todayInputValue()}
                {...register("fechaInicio")}
              />
              {errors.fechaInicio && (
                <p className="text-xs text-destructive">{errors.fechaInicio.message}</p>
              )}
            </div>

            {origenProceso === "placa" && (
              <div className="flex flex-col gap-1.5">
                <Label>{t("diasEsperados")}</Label>
                <Input
                  type="number"
                  {...register("diasEsperados", {
                    setValueAs: (v) => (v === "" ? undefined : Number(v)),
                  })}
                />
                <p className="text-xs text-muted-foreground">{t("diasEsperadosHint")}</p>
                {errors.diasEsperados && (
                  <p className="text-xs text-destructive">{errors.diasEsperados.message}</p>
                )}
              </div>
            )}

            {origenProceso === "placa" && (
              <div className="flex flex-col gap-1.5">
                <Label>{t("recetaAgar")}</Label>
                <Textarea
                  placeholder={t("recetaAgarPlaceholder")}
                  rows={3}
                  {...register("recetaAgar")}
                />
                {errors.recetaAgar && (
                  <p className="text-xs text-destructive">{errors.recetaAgar.message}</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push("/clonacion")}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {t("submit")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
