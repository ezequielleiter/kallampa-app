"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api-client";
import type { FungusType, SubstrateType, Batch } from "@/lib/types";
import type { BatchEstado } from "@/lib/constants";
import { BATCH_ESTADO_LABELS } from "@/lib/constants";
import {
  advanceToSustratoSchema,
  advanceToFructificacionSchema,
  advanceToCosechaSchema,
} from "@/lib/validations/batch.schema";

type AdvanceTargetStage = Exclude<BatchEstado, "inoculacion_grano" | "descartado">;

interface StageAdvanceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  targetStage: AdvanceTargetStage;
  fungusType: FungusType;
  onSuccess: () => void;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function StageAdvanceSheet({
  open,
  onOpenChange,
  batchId,
  targetStage,
  fungusType,
  onSuccess,
}: StageAdvanceSheetProps) {
  async function submit(body: Record<string, unknown>) {
    try {
      await apiFetch<Batch>(`/api/batches/${batchId}/advance-stage`, {
        method: "POST",
        body: JSON.stringify({ targetStage, ...body }),
      });
      toast.success("Lote actualizado");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo avanzar de etapa");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{BATCH_ESTADO_LABELS[targetStage]}</SheetTitle>
          <SheetDescription>
            Completá los datos para avanzar el lote a esta etapa.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4">
          {targetStage === "crecimiento_sustrato" && (
            <SustratoForm
              fungusType={fungusType}
              onSubmit={submit}
              onCancel={() => onOpenChange(false)}
            />
          )}
          {targetStage === "fructificacion" && (
            <FructificacionForm
              fungusType={fungusType}
              onSubmit={submit}
              onCancel={() => onOpenChange(false)}
            />
          )}
          {targetStage === "cosecha" && (
            <CosechaForm
              fungusType={fungusType}
              onSubmit={submit}
              onCancel={() => onOpenChange(false)}
            />
          )}
          {targetStage === "finalizado" && (
            <FinalizadoForm onSubmit={submit} onCancel={() => onOpenChange(false)} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// --- crecimiento_sustrato ---------------------------------------------

function SustratoForm({
  fungusType,
  onSubmit,
  onCancel,
}: {
  fungusType: FungusType;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const [substrateTypes, setSubstrateTypes] = useState<SubstrateType[]>([]);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(advanceToSustratoSchema),
    defaultValues: {
      diasEsperados: fungusType.diasEsperadosDefault.crecimientoSustrato,
    },
  });

  useEffect(() => {
    apiFetch<SubstrateType[]>("/api/substrate-types?activo=true").then(setSubstrateTypes);
  }, []);

  return (
    <form
      className="flex flex-col gap-4 py-2"
      onSubmit={handleSubmit((data) => onSubmit(data))}
    >
      <div className="flex flex-col gap-1.5">
        <Label>Tipo de sustrato</Label>
        <Controller
          control={control}
          name="tipoSustratoId"
          render={({ field }) => (
            <Select
              items={substrateTypes.map((s) => ({ label: s.nombre, value: s._id }))}
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Elegí un sustrato" />
              </SelectTrigger>
              <SelectContent>
                {substrateTypes.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.tipoSustratoId && (
          <p className="text-xs text-destructive">{errors.tipoSustratoId.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Kilos de sustrato</Label>
        <Input
          type="number"
          step="any"
          {...register("kilosSustrato", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
        />
        {errors.kilosSustrato && (
          <p className="text-xs text-destructive">{errors.kilosSustrato.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Precio por kg</Label>
        <Input
          type="number"
          step="any"
          {...register("precioPorKg", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
        />
        {errors.precioPorKg && (
          <p className="text-xs text-destructive">{errors.precioPorKg.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Fecha de inicio</Label>
        <Input
          type="date"
          defaultValue={todayInputValue()}
          {...register("fechaInicio")}
        />
        {errors.fechaInicio && (
          <p className="text-xs text-destructive">{errors.fechaInicio.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Días esperados</Label>
        <Input
          type="number"
          {...register("diasEsperados", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
        />
        {errors.diasEsperados && (
          <p className="text-xs text-destructive">{errors.diasEsperados.message}</p>
        )}
      </div>

      <SheetFooter className="px-0">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Confirmar
        </Button>
      </SheetFooter>
    </form>
  );
}

// --- fructificacion ------------------------------------------------------

function FructificacionForm({
  fungusType,
  onSubmit,
  onCancel,
}: {
  fungusType: FungusType;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(advanceToFructificacionSchema),
    defaultValues: {
      diasEsperados: fungusType.diasEsperadosDefault.fructificacion,
      recipientes: [{ codigo: "", pesoKg: 0, notas: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "recipientes" });

  return (
    <form
      className="flex flex-col gap-4 py-2"
      onSubmit={handleSubmit((data) => onSubmit(data))}
    >
      <div className="flex flex-col gap-1.5">
        <Label>Fecha de inicio</Label>
        <Input
          type="date"
          defaultValue={todayInputValue()}
          {...register("fechaInicio")}
        />
        {errors.fechaInicio && (
          <p className="text-xs text-destructive">{errors.fechaInicio.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Días esperados</Label>
        <Input
          type="number"
          {...register("diasEsperados", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
        />
        {errors.diasEsperados && (
          <p className="text-xs text-destructive">{errors.diasEsperados.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Recipientes</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ codigo: "", pesoKg: 0, notas: "" })}
          >
            <Plus /> Agregar
          </Button>
        </div>
        {errors.recipientes?.message && (
          <p className="text-xs text-destructive">{errors.recipientes.message}</p>
        )}
        <div className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex flex-col gap-2 rounded-lg border border-border p-2.5">
              <div className="flex items-center justify-between gap-2">
                <Input
                  placeholder="Código"
                  {...register(`recipientes.${index}.codigo` as const)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                >
                  <Trash2 />
                </Button>
              </div>
              <Input
                type="number"
                step="any"
                placeholder="Peso (kg)"
                {...register(`recipientes.${index}.pesoKg` as const, {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
              <Textarea
                placeholder="Notas (opcional)"
                {...register(`recipientes.${index}.notas` as const)}
              />
              {errors.recipientes?.[index]?.codigo && (
                <p className="text-xs text-destructive">
                  {errors.recipientes[index]?.codigo?.message}
                </p>
              )}
              {errors.recipientes?.[index]?.pesoKg && (
                <p className="text-xs text-destructive">
                  {errors.recipientes[index]?.pesoKg?.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <SheetFooter className="px-0">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Confirmar
        </Button>
      </SheetFooter>
    </form>
  );
}

// --- cosecha ---------------------------------------------------------

function CosechaForm({
  fungusType,
  onSubmit,
  onCancel,
}: {
  fungusType: FungusType;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(advanceToCosechaSchema),
    defaultValues: {
      diasEsperados: fungusType.diasEsperadosDefault.cosecha,
    },
  });

  return (
    <form
      className="flex flex-col gap-4 py-2"
      onSubmit={handleSubmit((data) => onSubmit(data))}
    >
      <div className="flex flex-col gap-1.5">
        <Label>Fecha de inicio</Label>
        <Input
          type="date"
          defaultValue={todayInputValue()}
          {...register("fechaInicio")}
        />
        {errors.fechaInicio && (
          <p className="text-xs text-destructive">{errors.fechaInicio.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Días esperados</Label>
        <Input
          type="number"
          {...register("diasEsperados", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
        />
        {errors.diasEsperados && (
          <p className="text-xs text-destructive">{errors.diasEsperados.message}</p>
        )}
      </div>

      <SheetFooter className="px-0">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Confirmar
        </Button>
      </SheetFooter>
    </form>
  );
}

// --- finalizado --------------------------------------------------------

function FinalizadoForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      await onSubmit({});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      <p className="text-sm text-muted-foreground">
        Se va a cerrar la etapa de cosecha y marcar el lote como finalizado.
      </p>
      <SheetFooter className="px-0">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleConfirm} disabled={isSubmitting}>
          Confirmar finalización
        </Button>
      </SheetFooter>
    </div>
  );
}
