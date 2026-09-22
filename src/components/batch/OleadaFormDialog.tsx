"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import type { Oleada, Recipiente } from "@/lib/types";

// Schema local (ver nota en NuevoRecipienteSheet.tsx sobre por que no se
// reusa `src/lib/validations/batch.schema.ts` para las oleadas de v2).
const oleadaSchema = z.object({
  fecha: z.coerce.date(),
  pesoKg: z.number().positive(),
  notas: z.string().trim().optional(),
});
type OleadaInput = z.infer<typeof oleadaSchema>;

interface OleadaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipienteId: string;
  oleada?: Oleada;
  onSuccess: () => void;
}

export function OleadaFormDialog({
  open,
  onOpenChange,
  recipienteId,
  oleada,
  onSuccess,
}: OleadaFormDialogProps) {
  const t = useTranslations("components.oleadaFormDialog");
  const isEdit = !!oleada;
  const fechaDefault = oleada?.fecha
    ? oleada.fecha.slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(oleadaSchema),
    defaultValues: {
      pesoKg: oleada?.pesoKg,
      notas: oleada?.notas ?? "",
    },
  });

  async function onSubmit(data: OleadaInput) {
    try {
      if (isEdit && oleada) {
        await apiFetch<Recipiente>(
          `/api/recipientes/${recipienteId}/oleadas/${oleada._id}`,
          { method: "PATCH", body: JSON.stringify(data) }
        );
        toast.success(t("updatedMessage"));
      } else {
        await apiFetch<Recipiente>(`/api/recipientes/${recipienteId}/oleadas`, {
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("newTitle")}</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-1.5">
            <Label>{t("fecha")}</Label>
            <Input type="date" defaultValue={fechaDefault} {...register("fecha")} />
            {errors.fecha && <p className="text-xs text-destructive">{errors.fecha.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("pesoCosechado")}</Label>
            <Input
              type="number"
              step="any"
              {...register("pesoKg", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
            />
            {errors.pesoKg && <p className="text-xs text-destructive">{errors.pesoKg.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("notas")}</Label>
            <Textarea {...register("notas")} />
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
