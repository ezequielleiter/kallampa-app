"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/kallampa/Field";
import { ChoiceList } from "@/components/kallampa/ChoiceList";
import { StatusTag } from "@/components/kallampa/StatusTag";
import { apiFetch } from "@/lib/api-client";
import type { FungusType, Jar, Recipiente, SubstrateType } from "@/lib/types";
import { codigoCorto } from "./lote-view";

// Schema LOCAL, no importado de `src/lib/validations/recipiente.schema.ts`
// (que sí ya tiene el shape equivalente): ese archivo importa
// `RECIPIENTE_ESTADOS` desde `@/models/Recipiente` para re-exportarlo, y
// cualquier import de ese archivo desde un Client Component arrastraría
// mongoose entero al bundle del navegador (rompe `next build`).
function buildSchema(msg: { frascos: string; sustrato: string; positivo: string }) {
  const objectIdString = z.string().min(1, msg.sustrato);
  const positivo = z.number(msg.positivo).positive(msg.positivo);
  return z.object({
    batchId: z.string().min(1),
    origenFrascoIds: z.array(z.string().min(1)).min(1, msg.frascos),
    tipoSustratoId: objectIdString,
    pesoSustratoKg: positivo,
    precioPorKg: positivo,
    fechaInicioIncubacion: z.coerce.date(),
    diasEsperadosIncubacion: positivo.optional(),
  });
}
type NuevoRecipienteInput = z.infer<ReturnType<typeof buildSchema>>;

interface NuevoRecipienteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  fungusType: FungusType;
  /** Todos los frascos del lote: los no elegibles se muestran deshabilitados. */
  jars: Jar[];
  onSuccess: () => void;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

// Solo se reparte grano de frascos colonizados (o ya usados, cuyo grano a
// veces se divide en mas de un recipiente).
const JAR_ELEGIBLE = new Set(["colonizado", "usado"]);

export function NuevoRecipienteSheet({
  open,
  onOpenChange,
  batchId,
  fungusType,
  jars,
  onSuccess,
}: NuevoRecipienteSheetProps) {
  const t = useTranslations("components.nuevoRecipienteSheet");
  const [substrateTypes, setSubstrateTypes] = useState<SubstrateType[]>([]);

  const schema = useMemo(
    () =>
      buildSchema({
        frascos: t("errorFrascos"),
        sustrato: t("errorSustrato"),
        positivo: t("errorPositivo"),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      batchId,
      origenFrascoIds: [] as string[],
      diasEsperadosIncubacion: fungusType.diasEsperadosDefault.incubacion,
    },
  });

  useEffect(() => {
    if (!open) return;
    void Promise.resolve().then(() => {
      reset({
        batchId,
        origenFrascoIds: [],
        diasEsperadosIncubacion: fungusType.diasEsperadosDefault.incubacion,
      });
      apiFetch<SubstrateType[]>("/api/substrate-types?activo=true").then(setSubstrateTypes);
    });
  }, [open, batchId, fungusType, reset]);

  async function onSubmit(data: NuevoRecipienteInput) {
    try {
      const recipiente = await apiFetch<Recipiente>("/api/recipientes", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast.success(t("successMessage", { codigo: codigoCorto(recipiente.numeroSeguimiento) }));
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorMessage"));
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit(onSubmit)} noValidate>
          <SheetHeader>
            <SheetTitle>{t("title")}</SheetTitle>
            <SheetDescription>{t("description")}</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <Field
              label={t("frascosOrigen")}
              hint={t("frascosOrigenHelp")}
              error={errors.origenFrascoIds?.message}
            >
              <Controller
                control={control}
                name="origenFrascoIds"
                render={({ field }) => (
                  <ChoiceList
                    type="checkbox"
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!errors.origenFrascoIds}
                    empty={t("noHayFrascos")}
                    items={jars.map((jar) => ({
                      value: jar._id,
                      label: jar.numeroGuia,
                      disabled: !JAR_ELEGIBLE.has(jar.estado),
                      aside:
                        jar.estado === "usado" ? (
                          t("jarYaUsado")
                        ) : (
                          <StatusTag kind="jar" estado={jar.estado} />
                        ),
                    }))}
                  />
                )}
              />
            </Field>

            <Field label={t("tipoSustrato")} error={errors.tipoSustratoId?.message}>
              <Controller
                control={control}
                name="tipoSustratoId"
                render={({ field }) => (
                  <Select
                    items={substrateTypes.map((s) => ({ label: s.nombre, value: s._id }))}
                    value={field.value ?? null}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full" aria-invalid={!!errors.tipoSustratoId}>
                      <SelectValue placeholder={t("elegirSustrato")} />
                    </SelectTrigger>
                    <SelectContent>
                      {substrateTypes.map((s) => (
                        <SelectItem key={s._id} value={s._id}>
                          {s.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t("pesoSustrato")} error={errors.pesoSustratoKg?.message}>
                <Input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  suffix="kg"
                  placeholder="0,00"
                  aria-invalid={!!errors.pesoSustratoKg}
                  {...register("pesoSustratoKg", {
                    setValueAs: (v) => (v === "" ? undefined : Number(v)),
                  })}
                />
              </Field>
              <Field label={t("precioPorKg")} error={errors.precioPorKg?.message}>
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label={t("fechaInicioIncubacion")}
                error={errors.fechaInicioIncubacion?.message}
              >
                <Input
                  type="date"
                  defaultValue={todayInputValue()}
                  {...register("fechaInicioIncubacion")}
                />
              </Field>
              <Field
                label={t("diasEsperadosIncubacion")}
                error={errors.diasEsperadosIncubacion?.message}
              >
                <Input
                  type="number"
                  inputMode="numeric"
                  aria-invalid={!!errors.diasEsperadosIncubacion}
                  {...register("diasEsperadosIncubacion", {
                    setValueAs: (v) => (v === "" ? undefined : Number(v)),
                  })}
                />
              </Field>
            </div>
          </SheetBody>
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancelar")}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {t("crear")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
