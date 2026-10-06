"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { CalculatorIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/kallampa/Field";
import { useFormat } from "@/components/kallampa/useFormat";
import { useAppLocale } from "@/components/shared/LocaleProvider";
import { CalculadoraSustrato, numeroAInput } from "@/components/herramientas/CalculadoraSustrato";
import { apiFetch } from "@/lib/api-client";
import {
  DENSIDAD_MEZCLA_DEFAULT,
  calcularReceta,
  calcularRecetaPorTachos,
  parseDecimal,
  resumenReceta,
  type BaseCalculo,
  type CantidadesSustrato,
  type ConfigTachos,
} from "@/lib/calculadora-sustrato";
import type { BatchDetail, RecetaSustratoLote } from "@/lib/types";

interface LoteRecetaSustratoProps {
  batch: BatchDetail;
  onChanged: () => void;
}

/**
 * Receta de sustrato del lote: card en la columna derecha del detalle. Muestra
 * la receta guardada (cantidades reales usadas) y abre un dialogo con la
 * calculadora para cargarla o editarla.
 */
export function LoteRecetaSustrato({ batch, onChanged }: LoteRecetaSustratoProps) {
  const t = useTranslations("components.loteRecetaSustrato");
  const tCommon = useTranslations("common");
  const fmt = useFormat();
  const { locale } = useAppLocale();
  const receta = batch.recetaSustrato ?? null;
  const [open, setOpen] = useState(false);
  // Se incrementa en cada apertura para remontar el formulario con valores frescos.
  const [formKey, setFormKey] = useState(0);
  const [confirmBorrar, setConfirmBorrar] = useState(false);
  const [borrando, setBorrando] = useState(false);

  function abrir() {
    setFormKey((k) => k + 1);
    setOpen(true);
  }

  async function borrar() {
    setBorrando(true);
    try {
      await apiFetch<null>(`/api/batches/${batch._id}/receta-sustrato`, { method: "DELETE" });
      setConfirmBorrar(false);
      toast.success(t("deletedMessage"));
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorMessage"));
    } finally {
      setBorrando(false);
    }
  }

  const resumen = receta ? resumenReceta(receta) : null;

  return (
    <div className="rounded-lg bg-surface-card p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="m-0 text-sm font-medium">{t("title")}</h2>
        {receta && (
          <span className="text-[12.5px] text-text-subtle tabular-nums">
            {fmt.fecha(receta.fecha)}
          </span>
        )}
      </div>

      {!receta ? (
        <div className="mt-3 flex flex-col items-start gap-3">
          <p className="m-0 text-[13px] text-text-subtle">{t("emptyState")}</p>
          <Button size="sm" onClick={abrir}>
            <CalculatorIcon /> {t("calcular")}
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {receta.base === "tachos" && receta.tachos && (
            <p className="m-0 text-[13px] text-text-muted">
              {t("tachosResumen", {
                cantidad: receta.tachos.cantidad,
                capacidad: numeroAInput(receta.tachos.capacidad, locale, 2),
                unidad: receta.tachos.unidad,
              })}
            </p>
          )}
          <ul className="m-0 flex list-none flex-col divide-y divide-divider p-0 text-[13px]">
            <FilaCantidad
              label={t("pellets")}
              valor={fmt.kg(receta.pelletsKg)}
              base={receta.base === "pellets" ? t("baseTag") : undefined}
            />
            <FilaCantidad label={t("agua")} valor={`${fmt.number(receta.aguaL, 2)} L`} />
            <FilaCantidad label={t("cal")} valor={fmt.kg(receta.calKg)} />
            <FilaCantidad
              label={t("grano")}
              valor={fmt.kg(receta.granoKg)}
              base={receta.base === "grano" ? t("baseTag") : undefined}
            />
          </ul>
          {resumen && (
            <div className="flex flex-col gap-1 border-t border-divider pt-2.5 text-[12.5px] text-text-muted tabular-nums">
              <span className="flex justify-between gap-3">
                {t("totalHumedo")}
                <span className="whitespace-nowrap">{fmt.kg(resumen.totalHumedoKg)}</span>
              </span>
              <span className="flex justify-between gap-3">
                {t("tasa")}
                <span className="whitespace-nowrap">{fmt.pct(resumen.tasaInoculacionPct, 2)}</span>
              </span>
            </div>
          )}
          {receta.notas && (
            <p className="m-0 text-[13px] break-words whitespace-pre-wrap text-text-muted">
              {receta.notas}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmBorrar(true)}>
              <TrashIcon /> {t("borrar")}
            </Button>
            <Button size="sm" onClick={abrir}>
              <PencilSimpleIcon /> {t("editar")}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[560px]">
          <RecetaForm
            key={formKey}
            batch={batch}
            receta={receta}
            onSaved={() => {
              setOpen(false);
              onChanged();
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmBorrar} onOpenChange={setConfirmBorrar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmBorrarTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("confirmBorrarDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" loading={borrando} onClick={borrar}>
              <TrashIcon /> {t("borrar")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FilaCantidad({ label, valor, base }: { label: string; valor: string; base?: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-1.5 first:pt-0">
      <span className="flex min-w-0 items-center gap-2 text-text-muted">
        {label}
        {base && <Badge variant="secondary">{base}</Badge>}
      </span>
      <span className="font-medium tabular-nums">{valor}</span>
    </li>
  );
}

type Reales = Record<keyof CantidadesSustrato, string>;

const CAMPOS: (keyof CantidadesSustrato)[] = ["pelletsKg", "aguaL", "calKg", "granoKg"];

function realesDesde(c: CantidadesSustrato, locale: string): Reales {
  return {
    pelletsKg: numeroAInput(c.pelletsKg, locale, 3),
    aguaL: numeroAInput(c.aguaL, locale, 2),
    calKg: numeroAInput(c.calKg, locale, 3),
    granoKg: numeroAInput(c.granoKg, locale, 3),
  };
}

function iguales(a: CantidadesSustrato, b: CantidadesSustrato) {
  return CAMPOS.every((k) => Math.abs(a[k] - b[k]) < 0.001);
}

/** Formulario del dialogo: calculadora + cantidades reales + fecha + notas. */
function RecetaForm({
  batch,
  receta,
  onSaved,
}: {
  batch: BatchDetail;
  receta: RecetaSustratoLote | null;
  onSaved: () => void;
}) {
  const t = useTranslations("components.loteRecetaSustrato");
  const tCommon = useTranslations("common");
  const { locale } = useAppLocale();

  const pesoGrano = batch.inoculacionGrano.pesoGranoKg;
  const initialBase: BaseCalculo = receta?.base ?? "grano";
  const initialTachos: ConfigTachos | undefined =
    receta?.base === "tachos" && receta.tachos
      ? { ...receta.tachos, densidadKgL: receta.tachos.densidadKgL ?? DENSIDAD_MEZCLA_DEFAULT }
      : undefined;
  const initialValor: number | undefined = receta
    ? receta.base === "pellets"
      ? receta.pelletsKg
      : receta.granoKg
    : pesoGrano > 0
      ? pesoGrano
      : undefined;

  const [base, setBase] = useState<BaseCalculo>(initialBase);
  const [tachos, setTachos] = useState<ConfigTachos | undefined>(initialTachos);
  const [calculadas, setCalculadas] = useState<CantidadesSustrato | null>(() =>
    initialBase === "tachos"
      ? initialTachos
        ? calcularRecetaPorTachos(initialTachos)
        : null
      : initialValor != null
        ? calcularReceta(initialBase, initialValor)
        : null
  );
  // Las cantidades reales siguen a la calculadora hasta que se edita alguna a mano.
  const [sincronizado, setSincronizado] = useState(() =>
    receta && calculadas ? iguales(receta, calculadas) : true
  );
  const [reales, setReales] = useState<Reales>(() =>
    receta
      ? realesDesde(receta, locale)
      : calculadas
        ? realesDesde(calculadas, locale)
        : { pelletsKg: "", aguaL: "", calKg: "", granoKg: "" }
  );
  const [fecha, setFecha] = useState(() =>
    receta ? receta.fecha.slice(0, 10) : format(new Date(), "yyyy-MM-dd")
  );
  const [notas, setNotas] = useState(receta?.notas ?? "");
  const [errores, setErrores] = useState<Partial<Record<keyof CantidadesSustrato | "fecha", string>>>(
    {}
  );
  const [guardando, setGuardando] = useState(false);

  function onCalculo(
    nuevaBase: BaseCalculo,
    _valor: number,
    c: CantidadesSustrato | null,
    nuevosTachos?: ConfigTachos
  ) {
    setBase(nuevaBase);
    setTachos(nuevosTachos);
    setCalculadas(c);
    if (sincronizado && c) setReales(realesDesde(c, locale));
  }

  function editarReal(k: keyof CantidadesSustrato, v: string) {
    setReales((r) => ({ ...r, [k]: v }));
    setSincronizado(false);
  }

  function volverACalculado() {
    if (!calculadas) return;
    setReales(realesDesde(calculadas, locale));
    setSincronizado(true);
    setErrores({});
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const n = {
      pelletsKg: parseDecimal(reales.pelletsKg),
      aguaL: parseDecimal(reales.aguaL),
      calKg: parseDecimal(reales.calKg),
      granoKg: parseDecimal(reales.granoKg),
    };
    const nuevosErrores: typeof errores = {};
    if (!(n.pelletsKg > 0)) nuevosErrores.pelletsKg = t("errorPositivo");
    if (!(n.granoKg > 0)) nuevosErrores.granoKg = t("errorPositivo");
    if (!Number.isFinite(n.aguaL) || n.aguaL < 0) nuevosErrores.aguaL = t("errorNoNegativo");
    if (!Number.isFinite(n.calKg) || n.calKg < 0) nuevosErrores.calKg = t("errorNoNegativo");
    if (!fecha) nuevosErrores.fecha = t("errorFecha");
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;
    if (base === "tachos" && (!tachos || !calcularRecetaPorTachos(tachos))) {
      toast.error(t("errorTachos"));
      return;
    }

    setGuardando(true);
    try {
      await apiFetch<RecetaSustratoLote>(`/api/batches/${batch._id}/receta-sustrato`, {
        method: "PUT",
        body: JSON.stringify({
          base,
          ...(base === "tachos" && tachos
            ? {
                tachos: {
                  cantidad: tachos.cantidad,
                  capacidad: tachos.capacidad,
                  unidad: tachos.unidad,
                  ...(tachos.unidad === "L" ? { densidadKgL: tachos.densidadKgL } : {}),
                },
              }
            : {}),
          ...n,
          fecha,
          ...(notas.trim() ? { notas: notas.trim() } : {}),
        }),
      });
      toast.success(t("savedMessage"));
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorMessage"));
    } finally {
      setGuardando(false);
    }
  }

  const etiquetas: Record<keyof CantidadesSustrato, { label: string; suffix: string }> = {
    pelletsKg: { label: t("pellets"), suffix: "kg" },
    aguaL: { label: t("agua"), suffix: "L" },
    calKg: { label: t("cal"), suffix: "kg" },
    granoKg: { label: t("grano"), suffix: "kg" },
  };

  return (
    <form className="contents" onSubmit={guardar} noValidate>
      <DialogHeader>
        <DialogTitle>{receta ? t("dialogTitleEditar") : t("dialogTitle")}</DialogTitle>
        <DialogDescription>{batch.numeroLote}</DialogDescription>
      </DialogHeader>

      <CalculadoraSustrato
        initialBase={initialBase}
        initialValor={initialValor}
        initialTachos={initialTachos}
        onChange={onCalculo}
      />

      <div className="flex flex-col gap-3 border-t border-divider pt-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="m-0 text-[13px] font-medium">{t("cantidadesReales")}</h3>
          {!sincronizado && calculadas && (
            <Button type="button" variant="link" size="xs" onClick={volverACalculado}>
              {t("volverACalculado")}
            </Button>
          )}
        </div>
        <p className="m-0 -mt-1.5 text-xs leading-[17px] text-text-subtle">
          {sincronizado ? t("cantidadesRealesHint") : t("cantidadesRealesEditadas")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {CAMPOS.map((k) => (
            <Field key={k} label={etiquetas[k].label} error={errores[k]}>
              <Input
                inputMode="decimal"
                autoComplete="off"
                suffix={etiquetas[k].suffix}
                value={reales[k]}
                aria-invalid={!!errores[k]}
                aria-label={etiquetas[k].label}
                onChange={(e) => editarReal(k, e.target.value)}
              />
            </Field>
          ))}
        </div>
        <Field label={t("fecha")} error={errores.fecha}>
          <Input
            type="date"
            value={fecha}
            aria-invalid={!!errores.fecha}
            aria-label={t("fecha")}
            onChange={(e) => setFecha(e.target.value)}
          />
        </Field>
        <Field label={t("notas")} optional>
          <Textarea
            aria-label={t("notas")}
            placeholder={t("notasPlaceholder")}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </Field>
      </div>

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
