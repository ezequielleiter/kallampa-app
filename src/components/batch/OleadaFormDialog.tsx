"use client";

import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldWarning } from "@/components/kallampa/Field";
import { useFormat } from "@/components/kallampa/useFormat";
import { apiFetch } from "@/lib/api-client";
import { pesoCosechadoRecipiente } from "@/lib/recipiente-utils";
import type { Oleada, Recipiente } from "@/lib/types";
import { codigoCorto, nombreSustrato } from "./lote-view";

// Por encima de este % de eficiencia biologica se avisa (sin bloquear): suele
// ser un error de carga del peso.
const EB_AVISO = 150;

// Schema local (ver nota en NuevoRecipienteSheet.tsx sobre por que no se
// reusa `src/lib/validations/recipiente.schema.ts` desde el cliente).
function buildSchema(msg: { peso: string; fecha: string }) {
  return z.object({
    fecha: z.coerce.date(msg.fecha),
    pesoKg: z.number(msg.peso).positive(msg.peso),
    notas: z.string().trim().optional(),
  });
}
type OleadaInput = z.infer<ReturnType<typeof buildSchema>>;

interface OleadaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipiente: Recipiente;
  oleada?: Oleada;
  onSuccess: () => void;
}

export function OleadaFormDialog({
  open,
  onOpenChange,
  recipiente,
  oleada,
  onSuccess,
}: OleadaFormDialogProps) {
  const t = useTranslations("components.oleadaFormDialog");
  const tCommon = useTranslations("common");
  const fmt = useFormat();
  const isEdit = !!oleada;
  const fechaDefault = oleada?.fecha
    ? oleada.fecha.slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  // Numero de oleada: la posicion cronologica si se edita, la siguiente si es nueva.
  const ordenadas = [...recipiente.oleadas].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );
  const numero = oleada
    ? ordenadas.findIndex((o) => o._id === oleada._id) + 1
    : ordenadas.length + 1;

  const schema = useMemo(
    () => buildSchema({ peso: t("errorPeso"), fecha: t("errorFecha") }),
    [t]
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      pesoKg: oleada?.pesoKg,
      notas: oleada?.notas ?? "",
    },
  });

  // Aviso no bloqueante: EB del recipiente con el peso que se esta cargando.
  const pesoActual = useWatch({ control, name: "pesoKg" }) as number | undefined;
  const pesoOtras = pesoCosechadoRecipiente(recipiente) - (oleada?.pesoKg ?? 0);
  const ebResultante =
    typeof pesoActual === "number" && pesoActual > 0 && recipiente.pesoSustratoKg > 0
      ? ((pesoOtras + pesoActual) / recipiente.pesoSustratoKg) * 100
      : null;

  async function onSubmit(data: OleadaInput) {
    const codigo = codigoCorto(recipiente.numeroSeguimiento);
    try {
      if (isEdit && oleada) {
        await apiFetch<Recipiente>(
          `/api/recipientes/${recipiente._id}/oleadas/${oleada._id}`,
          { method: "PATCH", body: JSON.stringify(data) }
        );
        toast.success(t("updatedMessage", { n: numero, codigo }));
      } else {
        await apiFetch<Recipiente>(`/api/recipientes/${recipiente._id}/oleadas`, {
          method: "POST",
          body: JSON.stringify(data),
        });
        toast.success(t("createdMessage", { n: numero, codigo, peso: fmt.kg(data.pesoKg) }));
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
        <form className="contents" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? t("editTitle") : t("newTitle")}
              <Badge>{t("badge", { n: numero })}</Badge>
            </DialogTitle>
            <DialogDescription>
              {recipiente.numeroSeguimiento} · {nombreSustrato(recipiente)} ·{" "}
              {fmt.kg(recipiente.pesoSustratoKg)}
            </DialogDescription>
          </DialogHeader>

          <Field label={t("pesoCosechado")} error={errors.pesoKg?.message}>
            <Input
              type="number"
              step="any"
              inputMode="decimal"
              suffix="kg"
              placeholder="0,00"
              autoFocus
              aria-invalid={!!errors.pesoKg}
              {...register("pesoKg", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
            />
          </Field>
          {ebResultante !== null && ebResultante > EB_AVISO && (
            <FieldWarning>{t("ebWarning", { eb: fmt.pct(ebResultante) })}</FieldWarning>
          )}
          <Field label={t("fecha")} error={errors.fecha?.message}>
            <Input type="date" defaultValue={fechaDefault} {...register("fecha")} />
          </Field>
          <Field label={t("notas")} optional>
            <Textarea placeholder={t("notasPlaceholder")} {...register("notas")} />
          </Field>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              {tCommon("cancel")}
            </DialogClose>
            <Button type="submit" loading={isSubmitting}>
              {t("guardar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
