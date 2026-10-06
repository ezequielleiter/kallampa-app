"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/kallampa/SegmentedControl";
import { useFormat } from "@/components/kallampa/useFormat";
import { useAppLocale } from "@/components/shared/LocaleProvider";
import { numeroAInput } from "@/components/herramientas/CalculadoraSustrato";
import { parseDecimal } from "@/lib/calculadora-sustrato";
import {
  DENSIDAD_MEZCLA_DEFAULT,
  calcularTachos,
  type UnidadTacho,
} from "@/lib/calculadora-tachos";

interface CalculadoraTachosProps {
  /** Total de la calculadora de sustrato (sustrato humedo + grano), en kg. */
  totalSugeridoKg: number | null;
}

/**
 * Calculadora de tachos: a partir de la cantidad final de sustrato con
 * micelio y del tamaño del tacho (kg o litros), cuantos tachos hacen falta.
 */
export function CalculadoraTachos({ totalSugeridoKg }: CalculadoraTachosProps) {
  const t = useTranslations("components.calculadoraTachos");
  const fmt = useFormat();
  const { locale } = useAppLocale();
  const inputId = useId();

  // El total sigue a la calculadora de sustrato hasta que se edita a mano.
  const [totalManual, setTotalManual] = useState<string | null>(null);
  const [capacidad, setCapacidad] = useState("10");
  const [unidad, setUnidad] = useState<UnidadTacho>("kg");
  const [densidad, setDensidad] = useState(() =>
    numeroAInput(DENSIDAD_MEZCLA_DEFAULT, locale),
  );

  const totalTexto =
    totalManual ??
    (totalSugeridoKg != null ? numeroAInput(totalSugeridoKg, locale, 2) : "");
  const resultado = calcularTachos(
    parseDecimal(totalTexto),
    parseDecimal(capacidad),
    unidad,
    parseDecimal(densidad),
  );
  const exacto =
    resultado != null &&
    Math.abs(resultado.kgUltimoTacho - resultado.kgPorTacho) < 0.005;

  return (
    <div className="@container">
      <div className="grid items-start gap-3.5 @2xl:grid-cols-2 @2xl:gap-x-6">
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col">
            <div className="mb-[5px] flex items-baseline justify-between gap-2">
              <label
                htmlFor={`${inputId}-total`}
                className="block text-xs text-text/70"
              >
                {t("totalLabel")}
              </label>
              {totalManual != null && totalSugeridoKg != null && (
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  onClick={() => setTotalManual(null)}
                >
                  {t("usarCalculado")}
                </Button>
              )}
            </div>
            <Input
              id={`${inputId}-total`}
              inputMode="decimal"
              autoComplete="off"
              suffix="kg"
              value={totalTexto}
              onChange={(e) => setTotalManual(e.target.value)}
            />
            <div className="mt-1.5 text-xs leading-[17px] text-text-subtle">
              {totalManual == null ? t("totalHint") : t("totalEditado")}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor={`${inputId}-capacidad`}
              className="block text-xs text-text/70"
            >
              {t("tamanoTacho")}
            </label>
            <SegmentedControl
              aria-label={t("unidadTacho")}
              block
              value={unidad}
              onChange={setUnidad}
              options={[
                { value: "kg", label: t("unidadKg") },
                { value: "L", label: t("unidadLitros") },
              ]}
            />
            <Input
              id={`${inputId}-capacidad`}
              inputMode="decimal"
              autoComplete="off"
              suffix={unidad}
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value)}
            />
          </div>

          {unidad === "L" && (
            <div className="flex flex-col">
              <label
                htmlFor={`${inputId}-densidad`}
                className="mb-[5px] block text-xs text-text/70"
              >
                {t("densidad")}
              </label>
              <Input
                id={`${inputId}-densidad`}
                inputMode="decimal"
                autoComplete="off"
                suffix="kg/L"
                value={densidad}
                onChange={(e) => setDensidad(e.target.value)}
              />
              <div className="mt-1.5 text-xs leading-[17px] text-text-subtle">
                {t("densidadHint")}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3.5">
          {resultado ? (
            <div className="rounded-md bg-surface-inset px-4 py-3">
              <div className="text-xs text-text-subtle">{t("necesitas")}</div>
              <div className="mt-0.5 text-[22px] font-medium tabular-nums">
                {t("resultado", { cantidad: resultado.tachosNecesarios })}
              </div>
              <div className="mt-1.5 text-xs leading-[17px] text-text-subtle tabular-nums">
                {t("kgPorTacho", { kg: fmt.kg(resultado.kgPorTacho) })}
                {!exacto &&
                  ` · ${t("ultimoTacho", { kg: fmt.kg(resultado.kgUltimoTacho) })}`}
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-surface-inset px-4 py-3 text-xs leading-[17px] text-danger-text">
              {t("valorInvalido")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
