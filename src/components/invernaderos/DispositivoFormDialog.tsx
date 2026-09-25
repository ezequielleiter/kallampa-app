"use client";

import { useForm } from "react-hook-form";
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
import { Field } from "@/components/kallampa/Field";
import { apiFetch } from "@/lib/api-client";
import { translateErrorMessage } from "@/lib/error-messages";
import type { Dispositivo, Invernadero } from "@/lib/types";
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

/** Alta/edicion de un dispositivo de monitoreo: nombre + dominio en la red local. */
export function DispositivoFormDialog({
  open,
  onOpenChange,
  invernadero,
  dispositivo,
  onSuccess,
}: DispositivoFormDialogProps) {
  const t = useTranslations("components.dispositivoFormDialog");
  const tCommon = useTranslations("common");
  const isEdit = !!dispositivo;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof dispositivoSchema>, unknown, DispositivoInput>({
    resolver: zodResolver(dispositivoSchema),
    defaultValues: {
      nombre: dispositivo?.nombre ?? "",
      dominio: dispositivo?.dominio ?? "",
    },
  });

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("newTitle")}</DialogTitle>
          <DialogDescription>{invernadero.nombre}</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-3.5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field
            label={t("nombre")}
            htmlFor="disp-nombre"
            error={errors.nombre && translateErrorMessage(errors.nombre.message)}
          >
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
            error={errors.dominio && translateErrorMessage(errors.dominio.message)}
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
