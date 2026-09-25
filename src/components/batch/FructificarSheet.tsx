"use client";

import { useMemo } from "react";
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
  SheetBody,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/kallampa/Field";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";
import type { FungusType, Recipiente } from "@/lib/types";
import { codigoCorto } from "./lote-view";

function buildSchema(positivo: string) {
  return z.object({
    fechaInicioFructificacion: z.coerce.date(),
    diasEsperadosFructificacion: z.number(positivo).positive(positivo).optional(),
  });
}
type FructificarInput = z.infer<ReturnType<typeof buildSchema>>;

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
  const schema = useMemo(() => buildSchema(t("errorPositivo")), [t]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
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
          <SheetHeader
            meta={
              <Badge variant="secondary" className="tabular-nums">
                {recipiente.numeroSeguimiento}
              </Badge>
            }
          >
            <SheetTitle>{t("title")}</SheetTitle>
            <SheetDescription>{t("description")}</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <Field label={t("fechaInicio")} error={errors.fechaInicioFructificacion?.message}>
              <Input
                type="date"
                defaultValue={todayInputValue()}
                {...register("fechaInicioFructificacion")}
              />
            </Field>
            <Field label={t("diasEsperados")} error={errors.diasEsperadosFructificacion?.message}>
              <Input
                type="number"
                inputMode="numeric"
                aria-invalid={!!errors.diasEsperadosFructificacion}
                {...register("diasEsperadosFructificacion", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
            </Field>
          </SheetBody>
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancelar")}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {t("confirmar")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
