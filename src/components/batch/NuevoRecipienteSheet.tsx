"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api-client";
import type { FungusType, Jar, Recipiente, SubstrateType } from "@/lib/types";

// Schema LOCAL, no importado de `src/lib/validations/recipiente.schema.ts`
// (que sí ya tiene el shape equivalente): ese archivo importa
// `RECIPIENTE_ESTADOS` desde `@/models/Recipiente` para re-exportarlo, y
// cualquier import de ese archivo desde un Client Component arrastraría
// mongoose entero al bundle del navegador (rompe `next build`).
const objectIdString = z.string().min(1, "Id requerido");
const nuevoRecipienteSchema = z.object({
  batchId: objectIdString,
  origenFrascoIds: z.array(objectIdString).min(1, "Seleccioná al menos un frasco de origen"),
  tipoSustratoId: objectIdString,
  pesoSustratoKg: z.number().positive(),
  precioPorKg: z.number().positive(),
  fechaInicioIncubacion: z.coerce.date(),
  diasEsperadosIncubacion: z.number().positive().optional(),
});
type NuevoRecipienteInput = z.infer<typeof nuevoRecipienteSchema>;

interface NuevoRecipienteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  fungusType: FungusType;
  onSuccess: () => void;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function NuevoRecipienteSheet({
  open,
  onOpenChange,
  batchId,
  fungusType,
  onSuccess,
}: NuevoRecipienteSheetProps) {
  const t = useTranslations("components.nuevoRecipienteSheet");
  const tEstadoJar = useTranslations("estados.jar");
  const [jarsDisponibles, setJarsDisponibles] = useState<Jar[]>([]);
  const [loadingJars, setLoadingJars] = useState(false);
  const [substrateTypes, setSubstrateTypes] = useState<SubstrateType[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(nuevoRecipienteSchema),
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
      setLoadingJars(true);
      apiFetch<Jar[]>(`/api/jars?batchId=${batchId}&estado=colonizado,usado`)
        .then(setJarsDisponibles)
        .catch((err) =>
          toast.error(err instanceof Error ? err.message : t("loadJarsError"))
        )
        .finally(() => setLoadingJars(false));
      apiFetch<SubstrateType[]>("/api/substrate-types?activo=true").then(setSubstrateTypes);
    });
  }, [open, batchId, fungusType, reset, t]);

  async function onSubmit(data: NuevoRecipienteInput) {
    try {
      await apiFetch<Recipiente>("/api/recipientes", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast.success(t("successMessage"));
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorMessage"));
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex flex-col gap-1.5">
            <Label>{t("frascosOrigen")}</Label>
            <p className="text-xs text-muted-foreground">{t("frascosOrigenHelp")}</p>
            <Controller
              control={control}
              name="origenFrascoIds"
              render={({ field }) => (
                <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-md border p-1">
                  {loadingJars ? (
                    <p className="p-3 text-center text-sm text-muted-foreground">
                      {t("cargando")}
                    </p>
                  ) : jarsDisponibles.length === 0 ? (
                    <p className="p-3 text-center text-sm text-muted-foreground">
                      {t("noHayFrascos")}
                    </p>
                  ) : (
                    jarsDisponibles.map((jar) => {
                      const selected = field.value.includes(jar._id);
                      return (
                        <button
                          key={jar._id}
                          type="button"
                          onClick={() =>
                            field.onChange(
                              selected
                                ? field.value.filter((id) => id !== jar._id)
                                : [...field.value, jar._id]
                            )
                          }
                          className={`flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors ${
                            selected ? "bg-accent" : "hover:bg-muted"
                          }`}
                        >
                          <span className="flex size-4 shrink-0 items-center justify-center">
                            {selected && <Check className="size-4 text-primary" />}
                          </span>
                          <span>{jar.numeroGuia}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {jar.estado === "usado" ? t("jarYaUsado") : tEstadoJar("colonizado")}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            />
            {errors.origenFrascoIds && (
              <p className="text-xs text-destructive">{errors.origenFrascoIds.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("tipoSustrato")}</Label>
            <Controller
              control={control}
              name="tipoSustratoId"
              render={({ field }) => (
                <Select
                  items={substrateTypes.map((s) => ({ label: s.nombre, value: s._id }))}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
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
            {errors.tipoSustratoId && (
              <p className="text-xs text-destructive">{errors.tipoSustratoId.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("pesoSustrato")}</Label>
            <Input
              type="number"
              step="any"
              {...register("pesoSustratoKg", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
            />
            {errors.pesoSustratoKg && (
              <p className="text-xs text-destructive">{errors.pesoSustratoKg.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("precioPorKg")}</Label>
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
            <Label>{t("fechaInicioIncubacion")}</Label>
            <Input
              type="date"
              defaultValue={todayInputValue()}
              {...register("fechaInicioIncubacion")}
            />
            {errors.fechaInicioIncubacion && (
              <p className="text-xs text-destructive">{errors.fechaInicioIncubacion.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("diasEsperadosIncubacion")}</Label>
            <Input
              type="number"
              {...register("diasEsperadosIncubacion", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
            />
            {errors.diasEsperadosIncubacion && (
              <p className="text-xs text-destructive">
                {errors.diasEsperadosIncubacion.message}
              </p>
            )}
          </div>

          <SheetFooter className="px-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancelar")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {t("crear")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
