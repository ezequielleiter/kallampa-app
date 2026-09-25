"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { FlaskIcon, PackageIcon, PlantIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChoiceList } from "@/components/kallampa/ChoiceList";
import { Field } from "@/components/kallampa/Field";
import { EmptyState, PageContainer, PageHeader } from "@/components/kallampa/PageHeader";
import { SegmentedControl } from "@/components/kallampa/SegmentedControl";
import { StatusTag } from "@/components/kallampa/StatusTag";
import { useBreadcrumbs } from "@/components/shared/Breadcrumbs";
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

const ORIGEN_ICON: Record<OrigenProceso, React.ReactNode> = {
  placa: <FlaskIcon />,
  comprado: <PackageIcon />,
  frascoGrano: <PlantIcon />,
};

export default function NuevaClonacionPage() {
  const t = useTranslations("pages.clonacionNueva");
  return (
    <Suspense
      fallback={
        <PageContainer>
          <EmptyState>{t("loading")}</EmptyState>
        </PageContainer>
      }
    >
      <NuevaClonacionForm />
    </Suspense>
  );
}

function NuevaClonacionForm() {
  const router = useRouter();
  const t = useTranslations("pages.clonacionNueva");
  const tOrigen = useTranslations("estados.origenProceso");
  const tNav = useTranslations("nav");
  const tList = useTranslations("pages.clonacion");
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

  useBreadcrumbs([
    { label: tNav("micelio"), href: "/clonacion" },
    { label: tList("title"), href: "/clonacion" },
    { label: t("title") },
  ]);

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

  const hongoSelect = (
    <Controller
      control={control}
      name="fungusTypeId"
      render={({ field }) => (
        <Select
          items={fungusTypes.map((f) => ({ label: f.nombre, value: f._id }))}
          value={field.value ?? null}
          onValueChange={(v) => handleFungusChange(v, field.onChange)}
        >
          <SelectTrigger className="w-full" aria-invalid={!!errors.fungusTypeId || undefined}>
            <SelectValue placeholder={t("elegirHongo")} />
          </SelectTrigger>
          <SelectContent>
            {fungusTypes.map((f) => (
              <SelectItem key={f._id} value={f._id}>
                {f.nombre}
                {f.nombreCientifico && (
                  <span className="text-text-subtle italic">{f.nombreCientifico}</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );

  return (
    <PageContainer className="max-w-[720px]">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <form
        className="flex flex-col gap-4 rounded-lg bg-surface-card px-5 py-[18px] shadow-sm"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Field label={t("origenProceso")}>
          <SegmentedControl<OrigenProceso>
            block
            aria-label={t("origenProceso")}
            value={origenProceso}
            onChange={handleOrigenProcesoChange}
            options={(["placa", "comprado", "frascoGrano"] as OrigenProceso[]).map((op) => ({
              value: op,
              label: tOrigen(op),
              icon: ORIGEN_ICON[op],
            }))}
          />
        </Field>

        {origenProceso === "placa" &&
          (loadingOrigen ? (
            <Field label={t("tipoHongo")}>
              <p className="m-0 text-[13px] text-text-subtle">{t("loadingOrigen")}</p>
            </Field>
          ) : origen.tipo !== "ninguno" ? (
            <Field label={t("tipoHongo")}>
              <div className="rounded-md bg-surface-inset px-3 py-2.5">
                <div className="text-[13.5px] font-medium">
                  {origen.tipo === "jar"
                    ? origen.jar.batch.fungusTypeId?.nombre
                    : origen.recipiente.batch.fungusTypeId?.nombre}
                </div>
                <div className="mt-0.5 text-xs text-text-subtle">
                  {origen.tipo === "jar"
                    ? t("heredaDeLote", {
                        numeroLote: origen.jar.batch.numeroLote,
                        codigo: origen.jar.numeroGuia,
                      })
                    : t("heredaDeLote", {
                        numeroLote: origen.recipiente.batch.numeroLote,
                        codigo: origen.recipiente.numeroSeguimiento,
                      })}
                </div>
              </div>
            </Field>
          ) : (
            <Field label={t("tipoHongo")} error={errors.fungusTypeId?.message}>
              {hongoSelect}
            </Field>
          ))}

        {origenProceso === "comprado" && (
          <Field label={t("tipoHongo")} error={errors.fungusTypeId?.message}>
            {hongoSelect}
          </Field>
        )}

        {origenProceso === "frascoGrano" && (
          <Field label={t("frascoGranoOrigen")} hint={t("frascoGranoOrigenHint")}>
            {loadingJarsGrano ? (
              <p className="m-0 text-[13px] text-text-subtle">{t("loading")}</p>
            ) : (
              <ChoiceList
                type="radio"
                value={jarSeleccionado?._id}
                onChange={(id) => setJarSeleccionado(jarsGrano.find((j) => j._id === id) ?? null)}
                empty={t("noJarsGrano")}
                items={jarsGrano.map((jar) => {
                  const batch = batchesById[jar.batchId];
                  return {
                    value: jar._id,
                    label: jar.numeroGuia,
                    meta: batch
                      ? `${batch.fungusTypeId?.nombre ?? "?"} · ${batch.numeroLote}`
                      : undefined,
                    aside: <StatusTag kind="jar" estado={jar.estado} />,
                  };
                })}
              />
            )}
          </Field>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {origenProceso === "placa" ? (
            <Field label={t("cantidadPlacas")} error={errors.cantidadPlacas?.message}>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                suffix={t("placasSuffix")}
                aria-invalid={!!errors.cantidadPlacas || undefined}
                {...register("cantidadPlacas", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
            </Field>
          ) : (
            <Field label={t("cantidadFrascos")} error={errors.cantidadFrascos?.message}>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                suffix={t("frascosSuffix")}
                aria-invalid={!!errors.cantidadFrascos || undefined}
                {...register("cantidadFrascos", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
            </Field>
          )}

          <Field label={t("fechaInicio")} error={errors.fechaInicio?.message}>
            <Input
              type="date"
              defaultValue={todayInputValue()}
              aria-invalid={!!errors.fechaInicio || undefined}
              {...register("fechaInicio")}
            />
          </Field>

          {origenProceso === "placa" && (
            <Field
              label={t("diasEsperados")}
              hint={t("diasEsperadosHint")}
              error={errors.diasEsperados?.message}
            >
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                suffix={t("diasSuffix")}
                aria-invalid={!!errors.diasEsperados || undefined}
                {...register("diasEsperados", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
            </Field>
          )}
        </div>

        {origenProceso === "placa" && (
          <Field label={t("recetaAgarLabel")} optional error={errors.recetaAgar?.message}>
            <Textarea
              placeholder={t("recetaAgarPlaceholder")}
              rows={3}
              {...register("recetaAgar")}
            />
          </Field>
        )}

        <div className="-mx-5 mt-1 -mb-[18px] flex justify-end gap-2 rounded-b-lg border-t border-divider bg-surface-inset px-5 py-3">
          <Button type="button" variant="outline" onClick={() => router.push("/clonacion")}>
            {t("cancel")}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {t("submit")}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
