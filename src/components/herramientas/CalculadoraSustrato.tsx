"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SegmentedControl } from "@/components/kallampa/SegmentedControl";
import { useFormat } from "@/components/kallampa/useFormat";
import { useAppLocale } from "@/components/shared/LocaleProvider";
import {
  RECETA_BASE,
  calcularReceta,
  parseDecimal,
  resumenReceta,
  type BaseCalculo,
  type CantidadesSustrato,
} from "@/lib/calculadora-sustrato";

/** Numero → texto para un input decimal, con el separador del idioma y sin ceros de mas. */
export function numeroAInput(
  v: number,
  locale: string,
  maxDecimals = 4,
): string {
  if (!Number.isFinite(v)) return "";
  const s = String(Number(v.toFixed(maxDecimals)));
  return locale === "es" ? s.replace(".", ",") : s;
}

function valorBase(base: BaseCalculo) {
  return base === "pellets" ? RECETA_BASE.pelletsKg : RECETA_BASE.granoKg;
}

interface CalculadoraSustratoProps {
  initialBase?: BaseCalculo;
  initialValor?: number;
  /** Se llama cada vez que el usuario cambia la base o el peso (no al montar). */
  onChange?: (
    base: BaseCalculo,
    valor: number,
    cantidades: CantidadesSustrato | null,
  ) => void;
}

/**
 * Calculadora de sustrato: a partir de los kg de pellets o de grano colonizado
 * que se tienen, escala la receta de base (pellets + agua + cal hidratada + grano).
 */
export function CalculadoraSustrato({
  initialBase = "pellets",
  initialValor,
  onChange,
}: CalculadoraSustratoProps) {
  const t = useTranslations("components.calculadoraSustrato");
  const fmt = useFormat();
  const { locale } = useAppLocale();
  const inputId = useId();
  const [base, setBase] = useState<BaseCalculo>(initialBase);
  const [texto, setTexto] = useState(() =>
    numeroAInput(initialValor ?? valorBase(initialBase), locale),
  );

  const valor = parseDecimal(texto);
  const cantidades = calcularReceta(base, valor);
  const resumen = cantidades ? resumenReceta(cantidades) : null;

  function cambiarTexto(next: string) {
    setTexto(next);
    const v = parseDecimal(next);
    onChange?.(base, v, calcularReceta(base, v));
  }

  function cambiarBase(next: BaseCalculo) {
    if (next === base) return;
    // Se precarga el peso de ese ingrediente en la receta actual, para que
    // cambiar de base no cambie la receta.
    const v = cantidades
      ? Number(
          (next === "pellets"
            ? cantidades.pelletsKg
            : cantidades.granoKg
          ).toFixed(3),
        )
      : valorBase(next);
    setBase(next);
    setTexto(numeroAInput(v, locale));
    onChange?.(next, v, calcularReceta(next, v));
  }

  const filas: {
    key: keyof CantidadesSustrato;
    label: string;
    valor: string;
    esBase: boolean;
  }[] = [
    {
      key: "pelletsKg",
      label: t("pellets"),
      valor: cantidades ? fmt.kg(cantidades.pelletsKg) : "—",
      esBase: base === "pellets",
    },
    {
      key: "aguaL",
      label: t("agua"),
      valor: cantidades ? `${fmt.number(cantidades.aguaL, 2)} L` : "—",
      esBase: false,
    },
    {
      key: "calKg",
      label: t("cal"),
      valor: cantidades
        ? cantidades.calKg < 1
          ? `${fmt.kg(cantidades.calKg)} · ${fmt.number(cantidades.calKg * 1000, 0)} g`
          : fmt.kg(cantidades.calKg)
        : "—",
      esBase: false,
    },
    {
      key: "granoKg",
      label: t("grano"),
      valor: cantidades ? fmt.kg(cantidades.granoKg) : "—",
      esBase: base === "grano",
    },
  ];

  // Con lugar (pagina de Herramientas) va en dos columnas: datos a la
  // izquierda y resultado a la derecha; en el dialogo del lote, apilado.
  const recetaBaseTexto = t("recetaBase", {
    pellets: fmt.kg(RECETA_BASE.pelletsKg),
    agua: `${fmt.number(RECETA_BASE.aguaL)} L`,
    cal: fmt.kg(RECETA_BASE.calKg),
    grano: fmt.kg(RECETA_BASE.granoKg),
  });

  return (
    <div className="@container">
      <div className="grid items-start gap-3.5 @2xl:grid-cols-2 @2xl:gap-x-6">
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-text/70">{t("baseLabel")}</span>
            <SegmentedControl
              aria-label={t("baseLabel")}
              block
              value={base}
              onChange={cambiarBase}
              options={[
                { value: "pellets", label: t("basePellets") },
                { value: "grano", label: t("baseGrano") },
              ]}
            />
          </div>

          <div className="flex flex-col">
            <label
              htmlFor={inputId}
              className="mb-[5px] block text-xs text-text/70"
            >
              {base === "pellets" ? t("pesoPellets") : t("pesoGrano")}
            </label>
            <Input
              id={inputId}
              inputMode="decimal"
              autoComplete="off"
              suffix="kg"
              value={texto}
              aria-invalid={!cantidades}
              onChange={(e) => cambiarTexto(e.target.value)}
            />
            {!cantidades && (
              <div className="mt-1.5 text-xs leading-[17px] text-danger-text">
                {t("valorInvalido")}
              </div>
            )}
          </div>

          <p className="m-0 hidden text-xs leading-[17px] text-text-subtle @2xl:block">
            {recetaBaseTexto}
          </p>
        </div>

        <div className="flex flex-col gap-3.5">
          <ul className="m-0 flex list-none flex-col divide-y divide-divider rounded-md border border-divider p-0">
            {filas.map((f) => (
              <li
                key={f.key}
                className="flex items-center justify-between gap-3 px-3 py-2 text-[13.5px]"
              >
                <span className="flex min-w-0 items-center gap-2">
                  {f.label}
                  {f.esBase && (
                    <Badge variant="secondary">{t("baseTag")}</Badge>
                  )}
                </span>
                <span className="font-medium tabular-nums">{f.valor}</span>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-surface-inset px-3 py-2">
              <div className="text-xs text-text-subtle">{t("totalHumedo")}</div>
              <div className="mt-0.5 text-[15px] font-medium tabular-nums">
                {resumen ? fmt.kg(resumen.totalHumedoKg) : "—"}
              </div>
            </div>
            <div className="rounded-md bg-surface-inset px-3 py-2">
              <div className="text-xs text-text-subtle">
                {t("tasaInoculacion")}
              </div>
              <div className="mt-0.5 text-[15px] font-medium tabular-nums">
                {resumen ? fmt.pct(resumen.tasaInoculacionPct, 2) : "—"}
              </div>
            </div>
          </div>

          <p className="m-0 text-xs leading-[17px] text-text-subtle @2xl:hidden">
            {recetaBaseTexto}
          </p>
        </div>
      </div>
    </div>
  );
}
