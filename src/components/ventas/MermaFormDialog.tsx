"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldWarning } from "@/components/kallampa/Field";
import { useFormat } from "@/components/kallampa/useFormat";
import { apiFetch } from "@/lib/api-client";
import { parseDecimal } from "@/lib/calculadora-sustrato";
import type { Merma, MotivoMerma, StockLote } from "@/lib/types";
import { useOpenKey } from "./useOpenKey";

const MOTIVOS: MotivoMerma[] = ["vencido", "regalado", "consumo_propio", "otro"];

interface MermaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchIdInicial?: string;
  onSaved: () => void;
}

/** Registrar producto que salio sin venderse (vencido, regalado, etc.). */
export function MermaFormDialog({ open, onOpenChange, batchIdInicial, onSaved }: MermaFormDialogProps) {
  const t = useTranslations("components.mermaFormDialog");
  const formKey = useOpenKey(open);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[440px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <MermaForm
          key={formKey}
          batchIdInicial={batchIdInicial}
          onSaved={() => {
            onOpenChange(false);
            onSaved();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

type Errores = Partial<Record<"batchId" | "fecha" | "kg" | "form", string>>;

function MermaForm({ batchIdInicial, onSaved }: { batchIdInicial?: string; onSaved: () => void }) {
  const t = useTranslations("components.mermaFormDialog");
  const tCommon = useTranslations("common");
  const tEstados = useTranslations("estados");
  const fmt = useFormat();
  const [stock, setStock] = useState<StockLote[] | null>(null);
  const [batchId, setBatchId] = useState(batchIdInicial ?? "");
  const [fecha, setFecha] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [kg, setKg] = useState("");
  const [motivo, setMotivo] = useState<MotivoMerma>("vencido");
  const [notas, setNotas] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    apiFetch<StockLote[]>("/api/stock")
      .then((data) => {
        if (!cancelado) setStock(data);
      })
      .catch((err) => {
        if (!cancelado) {
          setStock([]);
          toast.error(err instanceof Error ? err.message : t("loadError"));
        }
      });
    return () => {
      cancelado = true;
    };
  }, [t]);

  const opciones = (stock ?? []).filter((s) => s.disponibleKg > 0 || s.batchId === batchId);
  const seleccionado = opciones.find((s) => s.batchId === batchId);
  const etiqueta = (s: StockLote) =>
    t("loteOption", { numeroLote: s.numeroLote, disponible: fmt.kg(s.disponibleKg, 2) });

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const n = parseDecimal(kg);
    const nuevos: Errores = {};
    if (!batchId) nuevos.batchId = t("errorLote");
    if (!fecha) nuevos.fecha = t("errorFecha");
    if (!(n > 0)) nuevos.kg = t("errorKg");
    else if (seleccionado && n > seleccionado.disponibleKg + 1e-9)
      nuevos.kg = t("errorKgMax", { disponible: fmt.kg(seleccionado.disponibleKg, 2) });
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setGuardando(true);
    try {
      await apiFetch<Merma>("/api/mermas", {
        method: "POST",
        body: JSON.stringify({
          batchId,
          fecha,
          kg: n,
          motivo,
          ...(notas.trim() ? { notas: notas.trim() } : {}),
        }),
      });
      toast.success(t("savedMessage"));
      onSaved();
    } catch (err) {
      setErrores({ form: err instanceof Error ? err.message : t("errorMessage") });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="flex flex-col gap-3.5" onSubmit={guardar} noValidate>
      <Field label={t("lote")} error={errores.batchId}>
        <Select
          items={opciones.map((s) => ({ value: s.batchId, label: etiqueta(s) }))}
          value={batchId || null}
          onValueChange={(v) => setBatchId((v as string | null) ?? "")}
        >
          <SelectTrigger className="w-full" aria-label={t("lote")} aria-invalid={!!errores.batchId}>
            <SelectValue placeholder={stock === null ? t("cargando") : t("elegirLote")} />
          </SelectTrigger>
          <SelectContent>
            {opciones.map((s) => (
              <SelectItem key={s.batchId} value={s.batchId}>
                {etiqueta(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {stock !== null && opciones.length === 0 && (
          <p className="mt-1.5 mb-0 text-xs text-text-subtle">{t("sinStock")}</p>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("fecha")} error={errores.fecha}>
          <Input
            type="date"
            aria-label={t("fecha")}
            value={fecha}
            aria-invalid={!!errores.fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </Field>
        <Field
          label={t("kg")}
          error={errores.kg}
          hint={seleccionado ? t("kgHint", { disponible: fmt.kg(seleccionado.disponibleKg, 2) }) : undefined}
        >
          <Input
            inputMode="decimal"
            autoComplete="off"
            placeholder="0,00"
            suffix="kg"
            aria-label={t("kg")}
            aria-invalid={!!errores.kg}
            value={kg}
            onChange={(e) => setKg(e.target.value)}
          />
        </Field>
      </div>

      <Field label={t("motivo")}>
        <Select
          items={MOTIVOS.map((m) => ({ value: m, label: tEstados(`motivoMerma.${m}`) }))}
          value={motivo}
          onValueChange={(v) => v && setMotivo(v as MotivoMerma)}
        >
          <SelectTrigger className="w-full" aria-label={t("motivo")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MOTIVOS.map((m) => (
              <SelectItem key={m} value={m}>
                {tEstados(`motivoMerma.${m}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label={t("notas")} optional>
        <Textarea
          aria-label={t("notas")}
          placeholder={t("notasPlaceholder")}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
      </Field>

      {errores.form && <FieldWarning>{errores.form}</FieldWarning>}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          {tCommon("cancel")}
        </DialogClose>
        <Button type="submit" loading={guardando}>
          {t("guardar")}
        </Button>
      </DialogFooter>
    </form>
  );
}
