"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChoiceList } from "@/components/kallampa/ChoiceList";
import { Field } from "@/components/kallampa/Field";
import { StatusTag } from "@/components/kallampa/StatusTag";
import { apiFetch } from "@/lib/api-client";
import type { FrascoLiquido, Placa } from "@/lib/types";

// Schema LOCAL, no importado de `src/lib/validations/clonacion.schema.ts`
// (mismo motivo que en `NuevoRecipienteSheet.tsx`: ese archivo importa
// `@/models/**` para re-exportar los enums, y arrastraría mongoose al
// bundle del navegador). Mismo shape que `createFrascoLiquidoSchema`.
const nuevoFrascoLiquidoSchema = z.object({
  origenPlacaId: z.string().min(1, "Elegí una placa de origen"),
  fechaCreacion: z.coerce.date(),
});
type NuevoFrascoLiquidoInput = z.infer<typeof nuevoFrascoLiquidoSchema>;

interface NuevoFrascoLiquidoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Todas las placas de la clonacion: solo las colonizadas se pueden
   * elegir; el resto se muestra deshabilitado (no oculto). */
  placas: Placa[];
  onSuccess: () => void;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function NuevoFrascoLiquidoSheet({
  open,
  onOpenChange,
  placas,
  onSuccess,
}: NuevoFrascoLiquidoSheetProps) {
  const t = useTranslations("components.nuevoFrascoLiquidoSheet");
  const tCommon = useTranslations("common");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(nuevoFrascoLiquidoSchema),
  });

  useEffect(() => {
    if (!open) return;
    void Promise.resolve().then(() => {
      // Una placa colonizada no se consume: se puede reusar libremente, asi
      // que si hay una sola la dejamos elegida.
      const colonizadas = placas.filter((p) => p.estado === "colonizado");
      reset({ origenPlacaId: colonizadas.length === 1 ? colonizadas[0]._id : undefined });
    });
  }, [open, placas, reset]);

  async function onSubmit(data: NuevoFrascoLiquidoInput) {
    try {
      const creado = await apiFetch<FrascoLiquido>("/api/frascos-liquidos", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast.success(
        creado?.numeroGuia
          ? t("createdCodigo", { numero: creado.numeroGuia })
          : t("successMessage")
      );
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorMessage"));
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <form className="flex h-full flex-col" onSubmit={handleSubmit(onSubmit)} noValidate>
          <SheetHeader>
            <SheetTitle>{t("title")}</SheetTitle>
            <SheetDescription>{t("description")}</SheetDescription>
          </SheetHeader>

          <SheetBody>
            <Field label={t("placaOrigen")} error={errors.origenPlacaId?.message}>
              <Controller
                control={control}
                name="origenPlacaId"
                render={({ field }) => (
                  <ChoiceList
                    type="radio"
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!errors.origenPlacaId}
                    empty={t("noHayPlacas")}
                    items={placas.map((placa) => ({
                      value: placa._id,
                      label: placa.numeroPlaca,
                      disabled: placa.estado !== "colonizado",
                      aside: <StatusTag kind="placa" estado={placa.estado} />,
                    }))}
                  />
                )}
              />
            </Field>

            <Field label={t("fechaCreacion")} error={errors.fechaCreacion?.message}>
              <Input
                type="date"
                defaultValue={todayInputValue()}
                aria-invalid={!!errors.fechaCreacion || undefined}
                {...register("fechaCreacion")}
              />
            </Field>
          </SheetBody>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
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
