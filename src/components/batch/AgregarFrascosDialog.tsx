"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/kallampa/Field";
import { apiFetch } from "@/lib/api-client";
import type { Jar } from "@/lib/types";

// Schema local (ver nota en NuevoRecipienteSheet.tsx sobre por que no se
// reusa `src/lib/validations/*` desde el cliente).
function buildSchema(msg: string) {
  return z.object({ cantidad: z.number(msg).int(msg).positive(msg) });
}
type AgregarFrascosInput = z.infer<ReturnType<typeof buildSchema>>;

interface AgregarFrascosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  numeroLote: string;
  onSuccess: () => void;
}

export function AgregarFrascosDialog({
  open,
  onOpenChange,
  batchId,
  numeroLote,
  onSuccess,
}: AgregarFrascosDialogProps) {
  const t = useTranslations("components.jarsGrid");
  const tCommon = useTranslations("common");
  const schema = useMemo(() => buildSchema(t("errorCantidad")), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { cantidad: 1 } });

  async function onSubmit(data: AgregarFrascosInput) {
    try {
      await apiFetch<Jar[]>(`/api/batches/${batchId}/jars`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast.success(t("agregadosMessage", { count: data.cantidad }));
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("agregarErrorMessage"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form className="contents" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{t("agregarTitle")}</DialogTitle>
            <DialogDescription>{t("agregarDescription", { lote: numeroLote })}</DialogDescription>
          </DialogHeader>

          <Field label={t("cantidad")} error={errors.cantidad?.message}>
            <Input
              type="number"
              step="1"
              min="1"
              inputMode="numeric"
              autoFocus
              aria-invalid={!!errors.cantidad}
              {...register("cantidad", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
            />
          </Field>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              {tCommon("cancel")}
            </DialogClose>
            <Button type="submit" loading={isSubmitting}>
              {t("agregar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
