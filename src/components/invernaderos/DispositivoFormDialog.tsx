"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useAppLocale } from "@/components/shared/LocaleProvider";
import { apiFetch } from "@/lib/api-client";
import { translateErrorMessage } from "@/lib/error-messages";
import type { Dispositivo, Invernadero } from "@/lib/types";
import type { EquipoInflux } from "@/lib/monitoreo/tipos";
import {
  dispositivoSchema,
  type DispositivoInput,
} from "@/lib/validations/invernadero.schema";

interface DispositivoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invernadero: Invernadero;
  dispositivo?: Dispositivo;
  onSuccess: () => void;
}

const MANUAL = "__manual";
const NINGUNO = "__ninguno";
const RANGOS = [
  ["tempMin", "tempMax", "°C"],
  ["humMin", "humMax", "%"],
] as const;

/** "" → null (borrar), coma o punto decimal; texto invalido → NaN (lo marca el schema). */
function parseOpcional(v: unknown): number | null {
  if (v === "" || v == null) return null;
  return Number(String(v).trim().replace(",", "."));
}

/**
 * Alta/edicion de un dispositivo de monitoreo: nombre + dominio en la red
 * local, y opcionalmente su ID en InfluxDB (para los graficos) y los rangos
 * de calefaccion / humidificacion (lineas de referencia).
 */
export function DispositivoFormDialog({
  open,
  onOpenChange,
  invernadero,
  dispositivo,
  onSuccess,
}: DispositivoFormDialogProps) {
  const t = useTranslations("components.dispositivoFormDialog");
  const tCommon = useTranslations("common");
  const { locale } = useAppLocale();
  const isEdit = !!dispositivo;
  const [equipos, setEquipos] = useState<EquipoInflux[] | null>(null);
  const [equiposError, setEquiposError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);

  const inicial = (v: number | undefined) =>
    v == null ? "" : locale === "es" ? String(v).replace(".", ",") : String(v);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof dispositivoSchema>, unknown, DispositivoInput>({
    resolver: zodResolver(dispositivoSchema),
    defaultValues: {
      nombre: dispositivo?.nombre ?? "",
      dominio: dispositivo?.dominio ?? "",
      influxId: dispositivo?.influxId ?? null,
      // Inputs de texto (coma decimal); `setValueAs` los convierte.
      tempMin: inicial(dispositivo?.tempMin) as unknown as number,
      tempMax: inicial(dispositivo?.tempMax) as unknown as number,
      humMin: inicial(dispositivo?.humMin) as unknown as number,
      humMax: inicial(dispositivo?.humMax) as unknown as number,
    },
  });

  // Equipos que escriben en el bucket, para elegir el ID sin tipearlo.
  useEffect(() => {
    let vivo = true;
    apiFetch<EquipoInflux[]>("/api/monitoreo/equipos")
      .then((data) => {
        if (!vivo) return;
        setEquipos(data);
        const actual = dispositivo?.influxId;
        if (actual && !data.some((e) => e.id === actual)) setManual(true);
      })
      .catch((err) => {
        if (!vivo) return;
        setEquiposError(err instanceof Error ? err.message : t("equiposError"));
        setManual(true);
      });
    return () => {
      vivo = false;
    };
  }, [dispositivo?.influxId, t]);

  async function onSubmit(data: DispositivoInput) {
    const base = `/api/invernaderos/${invernadero._id}/dispositivos`;
    try {
      if (isEdit && dispositivo) {
        await apiFetch(`${base}/${dispositivo._id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        toast.success(t("updatedMessage", { nombre: data.nombre }));
      } else {
        await apiFetch(base, { method: "POST", body: JSON.stringify(data) });
        toast.success(t("createdMessage", { nombre: data.nombre, invernadero: invernadero.nombre }));
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorMessage"));
    }
  }

  const errorDe = (msg?: string) => (msg ? translateErrorMessage(msg) : undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[460px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("newTitle")}</DialogTitle>
          <DialogDescription>{invernadero.nombre}</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-3.5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field label={t("nombre")} htmlFor="disp-nombre" error={errorDe(errors.nombre?.message)}>
            <Input
              id="disp-nombre"
              placeholder={t("nombrePlaceholder")}
              autoFocus={!isEdit}
              aria-invalid={!!errors.nombre}
              {...register("nombre")}
            />
          </Field>
          <Field
            label={t("dominio")}
            htmlFor="disp-dominio"
            hint={t("dominioHint")}
            error={errorDe(errors.dominio?.message)}
          >
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[13px] text-text-subtle">
                http://
              </span>
              <Input
                id="disp-dominio"
                inputMode="url"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="sensor-carpa1.local"
                className="pl-[52px] tabular-nums"
                aria-invalid={!!errors.dominio}
                {...register("dominio")}
              />
            </div>
          </Field>

          <p className="mt-1 mb-0 text-xs tracking-[0.05em] text-text-subtle uppercase">
            {t("monitoreoTitle")}
          </p>
          <Field
            label={t("influxId")}
            htmlFor="disp-influx"
            optional
            hint={equiposError ? t("equiposFallback", { error: equiposError }) : t("influxIdHint")}
            error={errorDe(errors.influxId?.message)}
          >
            <Controller
              control={control}
              name="influxId"
              render={({ field }) =>
                manual ? (
                  <div className="flex gap-2">
                    <Input
                      id="disp-influx"
                      placeholder="0c2cc8"
                      maxLength={6}
                      autoCapitalize="off"
                      spellCheck={false}
                      className="tabular-nums"
                      aria-invalid={!!errors.influxId}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                    />
                    {equipos && equipos.length > 0 && (
                      <Button type="button" variant="outline" onClick={() => setManual(false)}>
                        {t("elegirDeLista")}
                      </Button>
                    )}
                  </div>
                ) : (
                  <Select
                    items={[
                      { value: NINGUNO, label: t("sinVincular") },
                      ...(equipos ?? []).map((e) => ({
                        value: e.id,
                        label: e.device ? `${e.id} · ${e.device}` : e.id,
                      })),
                      { value: MANUAL, label: t("ingresarManual") },
                    ]}
                    value={field.value || NINGUNO}
                    onValueChange={(v) => {
                      if (v === MANUAL) {
                        setManual(true);
                        return;
                      }
                      setValue("influxId", v === NINGUNO ? null : (v as string), {
                        shouldValidate: true,
                      });
                    }}
                  >
                    <SelectTrigger id="disp-influx" className="w-full tabular-nums" disabled={!equipos}>
                      <SelectValue placeholder={equipos ? t("sinVincular") : t("cargandoEquipos")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NINGUNO}>{t("sinVincular")}</SelectItem>
                      {(equipos ?? []).map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          <span className="tabular-nums">{e.id}</span>
                          {e.device && <span className="text-text-subtle">· {e.device}</span>}
                        </SelectItem>
                      ))}
                      <SelectItem value={MANUAL}>{t("ingresarManual")}</SelectItem>
                    </SelectContent>
                  </Select>
                )
              }
            />
          </Field>

          {RANGOS.map(([min, max, unidad]) => (
            <div key={min}>
              <p className="mb-[5px] text-xs text-text/70">
                {t(min === "tempMin" ? "rangoCalefaccion" : "rangoHumedad")}{" "}
                <span className="text-text-subtle">({tCommon("optional")})</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[min, max].map((name) => (
                  <Field
                    key={name}
                    error={errorDe(errors[name]?.message)}
                  >
                    <Input
                      aria-label={t(name)}
                      inputMode="decimal"
                      placeholder={t(name === min ? "minPlaceholder" : "maxPlaceholder")}
                      suffix={unidad}
                      aria-invalid={!!errors[name]}
                      {...register(name, { setValueAs: parseOpcional })}
                    />
                  </Field>
                ))}
              </div>
            </div>
          ))}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? t("guardar") : t("agregar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
