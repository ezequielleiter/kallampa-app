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
import { Label } from "@/components/ui/label";
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("newTitle")}</DialogTitle>
        </DialogHeader>
        <form className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-1.5">
            <Label>{t("nombre")}</Label>
            <Input {...register("nombre")} />
            {errors.nombre && (
              <p className="text-xs text-destructive">
                {translateErrorMessage(errors.nombre.message)}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("nombreCientifico")}</Label>
            <Input {...register("nombreCientifico")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("iniciales")}</Label>
            <Input {...register("iniciales")} maxLength={4} className="uppercase" />
            <p className="text-xs text-muted-foreground">{t("inicialesHelp")}</p>
            {errors.iniciales && (
              <p className="text-xs text-destructive">
                {translateErrorMessage(errors.iniciales.message)}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("notas")}</Label>
            <Textarea {...register("notas")} />
          </div>

          <p className="text-xs font-medium text-muted-foreground">{t("diasEsperadosTitle")}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>{t("inoculacionGrano")}</Label>
              <Input
                type="number"
                {...register("diasEsperadosDefault.inoculacionGrano", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
              {errors.diasEsperadosDefault?.inoculacionGrano && (
                <p className="text-xs text-destructive">
                  {translateErrorMessage(errors.diasEsperadosDefault.inoculacionGrano.message)}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("incubacion")}</Label>
              <Input
                type="number"
                {...register("diasEsperadosDefault.incubacion", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
              {errors.diasEsperadosDefault?.incubacion && (
                <p className="text-xs text-destructive">
                  {translateErrorMessage(errors.diasEsperadosDefault.incubacion.message)}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("fructificacion")}</Label>
              <Input
                type="number"
                {...register("diasEsperadosDefault.fructificacion", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
              {errors.diasEsperadosDefault?.fructificacion && (
                <p className="text-xs text-destructive">
                  {translateErrorMessage(errors.diasEsperadosDefault.fructificacion.message)}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("colonizacionPlacas")}</Label>
              <Input
                type="number"
                {...register("diasEsperadosDefault.colonizacionPlacas", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
              {errors.diasEsperadosDefault?.colonizacionPlacas && (
                <p className="text-xs text-destructive">
                  {translateErrorMessage(errors.diasEsperadosDefault.colonizacionPlacas.message)}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {t("guardar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
