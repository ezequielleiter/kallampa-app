"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlantIcon, FlaskIcon, PlusIcon } from "@phosphor-icons/react";
import { PageContainer, PageHeader } from "@/components/kallampa/PageHeader";
import { Field } from "@/components/kallampa/Field";
import { SegmentedControl } from "@/components/kallampa/SegmentedControl";
import { ChoiceList } from "@/components/kallampa/ChoiceList";
import { StatusTag } from "@/components/kallampa/StatusTag";
import { useBreadcrumbs } from "@/components/shared/Breadcrumbs";
import { apiFetch } from "@/lib/api-client";
import { translateErrorMessage } from "@/lib/error-messages";
import type { FungusType, GrainType, Batch, FrascoLiquido } from "@/lib/types";
import {
  createBatchSchema,
  type CreateBatchInput,
} from "@/lib/validations/batch.schema";

/** Nombre del hongo de un frasco líquido, resuelto vía su clonación. */
function frascoLiquidoHongoNombre(f: FrascoLiquido): string {
  return typeof f.clonacionId === "object" ? f.clonacionId.fungusTypeId?.nombre ?? "—" : "—";
}

type OrigenLote = "hongo" | "frascoLiquido";

export default function NuevoLotePage() {
  const router = useRouter();
  const t = useTranslations("pages.loteNuevo");
  const tLotes = useTranslations("pages.lotes");
  const tNav = useTranslations("nav");
  const [origen, setOrigen] = useState<OrigenLote>("hongo");
  const [fungusTypes, setFungusTypes] = useState<FungusType[]>([]);
  const [grainTypes, setGrainTypes] = useState<GrainType[]>([]);
  const [frascosLiquidos, setFrascosLiquidos] = useState<FrascoLiquido[]>([]);
  const [loadingFrascosLiquidos, setLoadingFrascosLiquidos] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createBatchSchema),
  });

  useBreadcrumbs([
    { label: tNav("produccion"), href: "/lotes" },
    { label: tLotes("title"), href: "/lotes" },
    { label: t("title") },
  ]);

  useEffect(() => {
    apiFetch<FungusType[]>("/api/fungus-types?activo=true").then(setFungusTypes);
    apiFetch<GrainType[]>("/api/grain-types?activo=true").then(setGrainTypes);
  }, []);

  useEffect(() => {
    if (origen !== "frascoLiquido" || frascosLiquidos.length > 0) return;
    void Promise.resolve().then(() => {
      setLoadingFrascosLiquidos(true);
      apiFetch<FrascoLiquido[]>("/api/frascos-liquidos?estado=colonizado")
        .then(setFrascosLiquidos)
        .finally(() => setLoadingFrascosLiquidos(false));
    });
  }, [origen, frascosLiquidos.length]);

  function handleOrigenChange(next: OrigenLote) {
    setOrigen(next);
    resetField("fungusTypeId");
    resetField("origenFrascoLiquidoId");
    resetField("diasEsperados");
  }

  function handleFungusChange(id: string | null, onChange: (v: string | null) => void) {
    onChange(id);
    const fungusType = fungusTypes.find((f) => f._id === id);
    if (fungusType) {
      setValue("diasEsperados", fungusType.diasEsperadosDefault.inoculacionGrano);
    }
  }

  function handleFrascoLiquidoChange(id: string | null, onChange: (v: string | null) => void) {
    onChange(id);
    const frasco = frascosLiquidos.find((f) => f._id === id);
    const diasEsperados =
      typeof frasco?.clonacionId === "object"
        ? frasco.clonacionId.fungusTypeId?.diasEsperadosDefault.inoculacionGrano
        : undefined;
    if (diasEsperados !== undefined) {
      setValue("diasEsperados", diasEsperados);
    }
  }

  async function onSubmit(data: CreateBatchInput) {
    try {
      const batch = await apiFetch<Batch>("/api/batches", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast.success(t("createdSuccess", { numeroLote: batch.numeroLote }));
      router.push(`/lotes/${batch._id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("createError"));
    }
  }

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <form
        className="flex flex-col gap-4 rounded-lg bg-surface-card px-5 py-[18px] shadow-sm"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Field
          label={t("origenLote")}
          error={
            origen === "frascoLiquido" && errors.fungusTypeId
              ? translateErrorMessage(errors.fungusTypeId.message)
              : undefined
          }
        >
          <SegmentedControl<OrigenLote>
            aria-label={t("origenLote")}
            value={origen}
            onChange={handleOrigenChange}
            options={[
              { value: "hongo", label: t("tipoHongo"), icon: <PlantIcon /> },
              { value: "frascoLiquido", label: t("frascoLiquido"), icon: <FlaskIcon /> },
            ]}
          />
        </Field>

        {origen === "hongo" ? (
          <Field
            label={t("tipoHongo")}
            error={errors.fungusTypeId && translateErrorMessage(errors.fungusTypeId.message)}
          >
            <Controller
              control={control}
              name="fungusTypeId"
              render={({ field }) => (
                <Select
                  items={fungusTypes.map((f) => ({ label: f.nombre, value: f._id }))}
                  value={field.value ?? null}
                  onValueChange={(v) => handleFungusChange(v, field.onChange)}
                >
                  <SelectTrigger className="w-full" aria-invalid={!!errors.fungusTypeId}>
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
          </Field>
        ) : (
          <Field
            label={t("frascoLiquido")}
            hint={t("frascoLiquidoHint")}
            error={
              errors.origenFrascoLiquidoId &&
              translateErrorMessage(errors.origenFrascoLiquidoId.message)
            }
          >
            <Controller
              control={control}
              name="origenFrascoLiquidoId"
              render={({ field }) => (
                <ChoiceList
                  type="radio"
                  value={field.value ?? undefined}
                  onChange={(v) => handleFrascoLiquidoChange(v, field.onChange)}
                  invalid={!!errors.origenFrascoLiquidoId}
                  empty={loadingFrascosLiquidos ? t("loading") : t("noFrascosLiquidos")}
                  items={frascosLiquidos.map((f) => ({
                    value: f._id,
                    label: f.numeroGuia,
                    meta: frascoLiquidoHongoNombre(f),
                    aside: <StatusTag kind="frascoLiquido" estado={f.estado} />,
                  }))}
                />
              )}
            />
          </Field>
        )}

        <Field
          label={t("tipoGrano")}
          error={errors.tipoGranoId && translateErrorMessage(errors.tipoGranoId.message)}
        >
          <Controller
            control={control}
            name="tipoGranoId"
            render={({ field }) => (
              <Select
                items={grainTypes.map((g) => ({ label: g.nombre, value: g._id }))}
                value={field.value ?? null}
                onValueChange={field.onChange}
              >
                <SelectTrigger className="w-full" aria-invalid={!!errors.tipoGranoId}>
                  <SelectValue placeholder={t("elegirGrano")} />
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
        </Field>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field
            label={t("pesoGrano")}
            error={errors.pesoGranoKg && translateErrorMessage(errors.pesoGranoKg.message)}
          >
            <Input
              type="number"
              step="any"
              inputMode="decimal"
              suffix="kg"
              placeholder="0,00"
              aria-invalid={!!errors.pesoGranoKg}
              {...register("pesoGranoKg", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
            />
          </Field>
          <Field
            label={t("precioPorKg")}
            error={errors.precioPorKg && translateErrorMessage(errors.precioPorKg.message)}
          >
            <Input
              type="number"
              step="any"
              inputMode="decimal"
              prefix="$"
              aria-invalid={!!errors.precioPorKg}
              {...register("precioPorKg", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
            />
          </Field>
          <Field
            label={t("cantidadFrascos")}
            error={errors.cantidadFrascos && translateErrorMessage(errors.cantidadFrascos.message)}
          >
            <Input
              type="number"
              inputMode="numeric"
              aria-invalid={!!errors.cantidadFrascos}
              {...register("cantidadFrascos", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field
            label={t("fechaInoculacion")}
            error={errors.fechaInicio && translateErrorMessage(errors.fechaInicio.message)}
          >
            <Input
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              {...register("fechaInicio")}
            />
          </Field>
          <Field
            label={t("diasEsperados")}
            className="sm:col-span-2"
            error={errors.diasEsperados && translateErrorMessage(errors.diasEsperados.message)}
          >
            <Input
              type="number"
              inputMode="numeric"
              className="sm:max-w-40"
              aria-invalid={!!errors.diasEsperados}
              {...register("diasEsperados", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
            />
          </Field>
        </div>

        <div className="-mx-5 mt-1 -mb-[18px] flex justify-end gap-2 rounded-b-lg border-t border-divider bg-surface-inset px-5 py-3">
          <Button type="button" variant="outline" render={<Link href="/lotes" />}>
            {t("cancel")}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            <PlusIcon /> {t("submit")}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
