"use client";

import { useForm } from "react-hook-form";
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
import { Field } from "@/components/kallampa/Field";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api-client";
import { translateErrorMessage } from "@/lib/error-messages";
import type { FungusType } from "@/lib/types";
import {
  fungusTypeCreateSchema,
  type FungusTypeCreateInput,
} from "@/lib/validations/catalog.schema";

// `fungusTypeCreateSchema` ya incluye el 4° campo opcional de Clonación
// (`diasEsperadosDefault.colonizacionPlacas`) — no hace falta extenderlo acá.

interface FungusTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fungusType?: FungusType;
  onSuccess: () => void;
}

export function FungusTypeFormDialog({
  open,
  onOpenChange,
  fungusType,
  onSuccess,
}: FungusTypeFormDialogProps) {
  const t = useTranslations("components.fungusTypeFormDialog");
  const tCommon = useTranslations("common");
  const isEdit = !!fungusType;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof fungusTypeCreateSchema>, unknown, FungusTypeCreateInput>({
    resolver: zodResolver(fungusTypeCreateSchema),
    defaultValues: {
      nombre: fungusType?.nombre ?? "",
      nombreCientifico: fungusType?.nombreCientifico ?? "",
      iniciales: fungusType?.iniciales ?? "",
      notas: fungusType?.notas ?? "",
      diasEsperadosDefault: {
        inoculacionGrano: fungusType?.diasEsperadosDefault.inoculacionGrano ?? 14,
        incubacion: fungusType?.diasEsperadosDefault.incubacion ?? 14,
        fructificacion: fungusType?.diasEsperadosDefault.fructificacion ?? 14,
        colonizacionPlacas: fungusType?.diasEsperadosDefault.colonizacionPlacas ?? undefined,
      },
    },
  });

  async function onSubmit(data: FungusTypeCreateInput) {
    try {
      if (isEdit && fungusType) {
        await apiFetch(`/api/fungus-types/${fungusType._id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        toast.success(t("updatedMessage"));
      } else {
        await apiFetch("/api/fungus-types", {
          method: "POST",
          body: JSON.stringify(data),
        });
        toast.success(t("createdMessage"));
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorMessage"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[460px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("newTitle")}</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-3.5" onSubmit={handleSubmit(onSubmit)}>
          <Field
            label={t("nombre")}
            error={errors.nombre ? translateErrorMessage(errors.nombre.message) : undefined}
          >
            <Input {...register("nombre")} />
          </Field>
          <Field label={t("nombreCientifico")}>
            <Input {...register("nombreCientifico")} />
          </Field>
          <Field
            label={t("iniciales")}
            hint={t("inicialesHelp")}
            error={errors.iniciales ? translateErrorMessage(errors.iniciales.message) : undefined}
          >
            <Input {...register("iniciales")} maxLength={4} className="uppercase" />
          </Field>
          <Field label={t("notas")}>
            <Textarea {...register("notas")} />
          </Field>

          <p className="mt-1 text-xs tracking-[0.05em] text-text-subtle uppercase">{t("diasEsperadosTitle")}</p>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label={t("inoculacionGrano")}
              error={
                errors.diasEsperadosDefault?.inoculacionGrano
                  ? translateErrorMessage(errors.diasEsperadosDefault.inoculacionGrano.message)
                  : undefined
              }
            >
              <Input
                type="number"
                {...register("diasEsperadosDefault.inoculacionGrano", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
            </Field>
            <Field
              label={t("incubacion")}
              error={
                errors.diasEsperadosDefault?.incubacion
                  ? translateErrorMessage(errors.diasEsperadosDefault.incubacion.message)
                  : undefined
              }
            >
              <Input
                type="number"
                {...register("diasEsperadosDefault.incubacion", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
            </Field>
            <Field
              label={t("fructificacion")}
              error={
                errors.diasEsperadosDefault?.fructificacion
                  ? translateErrorMessage(errors.diasEsperadosDefault.fructificacion.message)
                  : undefined
              }
            >
              <Input
                type="number"
                {...register("diasEsperadosDefault.fructificacion", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
            </Field>
            <Field
              label={t("colonizacionPlacas")}
              error={
                errors.diasEsperadosDefault?.colonizacionPlacas
                  ? translateErrorMessage(errors.diasEsperadosDefault.colonizacionPlacas.message)
                  : undefined
              }
            >
              <Input
                type="number"
                {...register("diasEsperadosDefault.colonizacionPlacas", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {t("guardar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
