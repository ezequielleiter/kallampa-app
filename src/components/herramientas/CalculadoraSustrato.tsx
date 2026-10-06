"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SegmentedControl } from "@/components/kallampa/SegmentedControl";
import { useFormat } from "@/components/kallampa/useFormat";
import { useAppLocale } from "@/components/shared/LocaleProvider";
import {
  DENSIDAD_MEZCLA_DEFAULT,
  RECETA_BASE,
  calcularReceta,
  calcularRecetaPorTachos,
  kgMezclaTachos,
  parseDecimal,
  resumenReceta,
  type BaseCalculo,
  type CantidadesSustrato,
  type ConfigTachos,
  type UnidadTacho,
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

type BasePeso = Exclude<BaseCalculo, "tachos">;

function valorBase(base: BasePeso) {
  return base === "pellets" ? RECETA_BASE.pelletsKg : RECETA_BASE.granoKg;
}

const TACHOS_DEFAULT: ConfigTachos = {
  cantidad: 1,
  capacidad: 10,
  unidad: "kg",
  densidadKgL: DENSIDAD_MEZCLA_DEFAULT,
};

interface TachosTexto {
  cantidad: string;
  capacidad: string;
  unidad: UnidadTacho;
  densidad: string;
}

function tachosDesdeTexto(t: TachosTexto): ConfigTachos {
  return {
    cantidad: parseDecimal(t.cantidad),
    capacidad: parseDecimal(t.capacidad),
    unidad: t.unidad,
    densidadKgL: parseDecimal(t.densidad),
  };
}

function calcular(
  base: BaseCalculo,
  valor: number,
  tachos: ConfigTachos,
): CantidadesSustrato | null {
  return base === "tachos"
    ? calcularRecetaPorTachos(tachos)
    : calcularReceta(base, valor);
}

interface CalculadoraSustratoProps {
  initialBase?: BaseCalculo;
  initialValor?: number;
  initialTachos?: ConfigTachos;
  /**
   * Se llama cada vez que el usuario cambia la base, el peso o los tachos
   * (no al montar). Con base "tachos", `valor` son los kg de mezcla y se
   * pasa la configuracion de los tachos.
   */
  onChange?: (
    base: BaseCalculo,
    valor: number,
    cantidades: CantidadesSustrato | null,
    tachos?: ConfigTachos,
  ) => void;
}

/**
 * Calculadora de sustrato: a partir de los kg de pellets o de grano colonizado
 * que se tienen, o de los tachos que hay que llenar, escala la receta de base
 * (pellets + agua + cal hidratada + grano).
 */
export function CalculadoraSustrato({
  initialBase = "pellets",
  initialValor,
  initialTachos,
  onChange,
}: CalculadoraSustratoProps) {
  const t = useTranslations("components.calculadoraSustrato");
  const fmt = useFormat();
  const { locale } = useAppLocale();
  const inputId = useId();
  const [base, setBase] = useState<BaseCalculo>(initialBase);
  const [texto, setTexto] = useState(() =>
    numeroAInput(
      initialValor ??
        valorBase(initialBase === "tachos" ? "pellets" : initialBase),
      locale,
    ),
  );
  const [tachosTexto, setTachosTexto] = useState<TachosTexto>(() => {
    const c = initialTachos ?? TACHOS_DEFAULT;
    return {
      cantidad: String(c.cantidad),
      capacidad: numeroAInput(c.capacidad, locale),
      unidad: c.unidad,
      densidad: numeroAInput(
        Number.isFinite(c.densidadKgL) && c.densidadKgL > 0
          ? c.densidadKgL
          : DENSIDAD_MEZCLA_DEFAULT,
        locale,
      ),
    };
  });

  const valor = parseDecimal(texto);
  const tachos = tachosDesdeTexto(tachosTexto);
  const cantidades = calcular(base, valor, tachos);
  const resumen = cantidades ? resumenReceta(cantidades) : null;
  const kgMezcla = base === "tachos" ? kgMezclaTachos(tachos) : null;

  function avisar(nextBase: BaseCalculo, v: number, cfg: ConfigTachos) {
    if (nextBase === "tachos") {
      onChange?.(
        nextBase,
        kgMezclaTachos(cfg) ?? NaN,
        calcularRecetaPorTachos(cfg),
        cfg,
      );
    } else {
      onChange?.(nextBase, v, calcularReceta(nextBase, v));
    }
  }

  function cambiarTexto(next: string) {
    setTexto(next);
    avisar(base, parseDecimal(next), tachos);
  }

  function cambiarTachos(patch: Partial<TachosTexto>) {
    const next = { ...tachosTexto, ...patch };
    setTachosTexto(next);
    avisar(base, valor, tachosDesdeTexto(next));
  }

  function cambiarBase(next: BaseCalculo) {
    if (next === base) return;
    setBase(next);
    if (next === "tachos") {
      avisar(next, valor, tachos);
      return;
    }
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
    setTexto(numeroAInput(v, locale));
    avisar(next, v, tachos);
  }

  const cantidadTachos = Number.isInteger(tachos.cantidad)
    ? tachos.cantidad
    : 0;
  const porTacho =
    base === "tachos" && cantidades && cantidadTachos > 1
      ? t("porTacho", {
          pellets: fmt.kg(cantidades.pelletsKg / cantidadTachos),
          agua: `${fmt.number(cantidades.aguaL / cantidadTachos, 2)} L`,
          cal: fmt.kg(cantidades.calKg / cantidadTachos),
          grano: fmt.kg(cantidades.granoKg / cantidadTachos),
        })
      : null;

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
                { value: "tachos", label: t("baseTachos") },
              ]}
            />
          </div>

          {base === "tachos" ? (
            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label
                    htmlFor={`${inputId}-cantidad`}
                    className="mb-[5px] block text-xs text-text/70"
                  >
                    {t("cantidadTachos")}
                  </label>
                  <Input
                    id={`${inputId}-cantidad`}
                    inputMode="numeric"
                    autoComplete="off"
                    value={tachosTexto.cantidad}
                    aria-invalid={!kgMezcla}
                    onChange={(e) =>
                      cambiarTachos({ cantidad: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col">
                  <label
                    htmlFor={`${inputId}-capacidad`}
                    className="mb-[5px] block text-xs text-text/70"
                  >
                    {t("tamanoTacho")}
                  </label>
                  <Input
                    id={`${inputId}-capacidad`}
                    inputMode="decimal"
                    autoComplete="off"
                    suffix={tachosTexto.unidad}
                    value={tachosTexto.capacidad}
                    aria-invalid={!kgMezcla}
                    onChange={(e) =>
                      cambiarTachos({ capacidad: e.target.value })
                    }
                  />
                </div>
              </div>
              <SegmentedControl
                aria-label={t("unidadTacho")}
                block
                value={tachosTexto.unidad}
                onChange={(unidad) => cambiarTachos({ unidad })}
                options={[
                  { value: "kg", label: t("unidadKg") },
                  { value: "L", label: t("unidadLitros") },
                ]}
              />
              {tachosTexto.unidad === "L" && (
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
                    value={tachosTexto.densidad}
                    aria-invalid={!kgMezcla}
                    onChange={(e) =>
                      cambiarTachos({ densidad: e.target.value })
                    }
                  />
                  <div className="mt-1.5 text-xs leading-[17px] text-text-subtle">
                    {t("densidadHint")}
                  </div>
                </div>
              )}
              {kgMezcla ? (
                <div className="text-xs leading-[17px] text-text-subtle">
                  {t("mezclaTachos", { kg: fmt.kg(kgMezcla) })}
                </div>
              ) : (
                <div className="text-xs leading-[17px] text-danger-text">
                  {t("tachosInvalido")}
                </div>
              )}
            </div>
          ) : (
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
          )}

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

          {porTacho && (
            <p className="m-0 text-xs leading-[17px] text-text-subtle">
              {porTacho}
            </p>
          )}

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
