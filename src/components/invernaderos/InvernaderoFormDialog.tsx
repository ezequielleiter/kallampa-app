"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/kallampa/Field";
import { useFormat } from "@/components/kallampa/useFormat";
import { useAppLocale } from "@/components/shared/LocaleProvider";
import { apiFetch } from "@/lib/api-client";
import { translateErrorMessage } from "@/lib/error-messages";
import type { Invernadero } from "@/lib/types";
import {
  createInvernaderoSchema,
  type CreateInvernaderoInput,
} from "@/lib/validations/invernadero.schema";
import { parseMedida, superficieM2, volumenM3 } from "./medidas";

interface InvernaderoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invernadero?: Invernadero;
  onSuccess: () => void;
}

const MEDIDAS = ["altoM", "largoM", "profundidadM"] as const;

export function InvernaderoFormDialog({
  open,
  onOpenChange,
  invernadero,
  onSuccess,
}: InvernaderoFormDialogProps) {
  const t = useTranslations("components.invernaderoFormDialog");
  const tCommon = useTranslations("common");
  const fmt = useFormat();
  const { locale } = useAppLocale();
  const isEdit = !!invernadero;

  // En español el decimal se muestra con coma ("2,5"); el parseo acepta ambos.
  const medidaInicial = (v: number | undefined) =>
    v == null ? "" : locale === "es" ? String(v).replace(".", ",") : String(v);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof createInvernaderoSchema>, unknown, CreateInvernaderoInput>({
    resolver: zodResolver(createInvernaderoSchema),
    defaultValues: {
      nombre: invernadero?.nombre ?? "",
      notas: invernadero?.notas ?? "",
      // Los inputs son de texto (coma decimal); `setValueAs` los convierte.
      altoM: medidaInicial(invernadero?.altoM) as unknown as number,
      largoM: medidaInicial(invernadero?.largoM) as unknown as number,
      profundidadM: medidaInicial(invernadero?.profundidadM) as unknown as number,
      precioKwh: medidaInicial(invernadero?.precioKwh) as unknown as number,
    },
  });

  const [alto, largo, prof] = useWatch({ control, name: [...MEDIDAS] }).map(parseMedida);
  const medidasValidas = [alto, largo, prof].every((n) => n != null && n > 0);

  async function onSubmit(data: CreateInvernaderoInput) {
    try {
      if (isEdit && invernadero) {
        await apiFetch(`/api/invernaderos/${invernadero._id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        toast.success(t("updatedMessage", { nombre: data.nombre }));
      } else {
        await apiFetch("/api/invernaderos", {
          method: "POST",
          body: JSON.stringify(data),
        });
        toast.success(t("createdMessage", { nombre: data.nombre }));
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorMessage"));
    }
  }

  const labels = { altoM: t("alto"), largoM: t("largo"), profundidadM: t("profundidad") };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[440px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("newTitle")}</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-3.5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field
            label={t("nombre")}
            htmlFor="inv-nombre"
            error={errors.nombre && translateErrorMessage(errors.nombre.message)}
          >
            <Input
              id="inv-nombre"
              placeholder={t("nombrePlaceholder")}
              aria-invalid={!!errors.nombre}
              autoFocus={!isEdit}
              {...register("nombre")}
            />
          </Field>

          <div>
            <p className="mb-2 text-xs tracking-[0.05em] text-text-subtle uppercase">
              {t("medidasTitle")}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {MEDIDAS.map((name) => (
                <Field
                  key={name}
                  label={labels[name]}
                  htmlFor={`inv-${name}`}
                  error={errors[name] && t("errorMedida")}
                >
                  <Input
                    id={`inv-${name}`}
                    inputMode="decimal"
                    placeholder="0,00"
                    suffix="m"
                    aria-invalid={!!errors[name]}
                    {...register(name, { setValueAs: parseMedida })}
                  />
                </Field>
              ))}
            </div>
            <p className="mt-2 mb-0 text-xs text-text-subtle tabular-nums">
              {medidasValidas
                ? t("calculo", {
                    superficie: fmt.number(superficieM2({ altoM: alto!, largoM: largo!, profundidadM: prof! }), 2),
                    volumen: fmt.number(volumenM3({ altoM: alto!, largoM: largo!, profundidadM: prof! }), 2),
                  })
                : t("calculoHint")}
            </p>
          </div>

          <Field
            label={t("precioKwh")}
            htmlFor="inv-precioKwh"
            optional
            hint={t("precioKwhHint")}
            error={errors.precioKwh && t("errorMedida")}
          >
            <Input
              id="inv-precioKwh"
              inputMode="decimal"
              placeholder="0,00"
              prefix="$"
              suffix="/kWh"
              className="pr-12"
              aria-invalid={!!errors.precioKwh}
              // Vacio → null: en la edicion borra el precio cargado.
              {...register("precioKwh", { setValueAs: (v) => parseMedida(v) ?? null })}
            />
          </Field>

          <Field label={t("notas")} htmlFor="inv-notas" optional>
            <Textarea id="inv-notas" placeholder={t("notasPlaceholder")} {...register("notas")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? t("guardar") : t("crear")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
