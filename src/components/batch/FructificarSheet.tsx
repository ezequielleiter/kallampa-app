"use client";

import { useForm } from "react-hook-form";
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
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api-client";
import type { FungusType, Recipiente } from "@/lib/types";

const fructificarSchema = z.object({
  fechaInicioFructificacion: z.coerce.date(),
  diasEsperadosFructificacion: z.number().positive().optional(),
});
type FructificarInput = z.infer<typeof fructificarSchema>;

interface FructificarSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipiente: Recipiente;
  fungusType: FungusType;
  onSuccess: () => void;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function FructificarSheet({
  open,
  onOpenChange,
  recipiente,
  fungusType,
  onSuccess,
}: FructificarSheetProps) {
  const t = useTranslations("components.fructificarSheet");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(fructificarSchema),
    defaultValues: {
      diasEsperadosFructificacion: fungusType.diasEsperadosDefault.fructificacion,
    },
  });

  async function onSubmit(data: FructificarInput) {
    try {
      await apiFetch<Recipiente>(`/api/recipientes/${recipiente._id}/fructificar`, {
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
          <SheetDescription>{recipiente.numeroSeguimiento}</SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-col gap-4 px-4 py-2"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex flex-col gap-1.5">
            <Label>{t("fechaInicio")}</Label>
            <Input
              type="date"
              defaultValue={todayInputValue()}
              {...register("fechaInicioFructificacion")}
            />
            {errors.fechaInicioFructificacion && (
              <p className="text-xs text-destructive">
                {errors.fechaInicioFructificacion.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("diasEsperados")}</Label>
            <Input
              type="number"
              {...register("diasEsperadosFructificacion", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
            />
            {errors.diasEsperadosFructificacion && (
              <p className="text-xs text-destructive">
                {errors.diasEsperadosFructificacion.message}
              </p>
            )}
          </div>

          <SheetFooter className="px-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancelar")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {t("confirmar")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
