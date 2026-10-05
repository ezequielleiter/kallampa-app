"use client";

import type * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  FlaskIcon,
  GrainsIcon,
  PackageIcon,
  PlantIcon,
  ScalesIcon,
  type Icon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { StatusTag } from "@/components/kallampa/StatusTag";
import type { StepState } from "@/components/kallampa/Stepper";
import { useFormat } from "@/components/kallampa/useFormat";
import { getOrigenFrascosLabel } from "@/lib/recipiente-utils";
import type { BatchDetail } from "@/lib/types";
import {
  codigoCorto,
  diasIncubacion,
  nombreSustrato,
  trazabilidadLote,
  type EtapaTrazaKey,
} from "./lote-view";

interface Fila {
  id: string;
  text: string;
  end: React.ReactNode;
}

interface Etapa {
  key: EtapaTrazaKey;
  icon: Icon;
  fecha?: string;
  detail: React.ReactNode;
  rows?: Fila[];
  chips?: React.ReactNode;
}

/** Linea de tiempo de las etapas del lote (pestaña "Trazabilidad"). */
export function LoteTrazabilidad({ batch }: { batch: BatchDetail }) {
  const t = useTranslations("components.loteTrazabilidad");
  const tEstados = useTranslations("estados");
  const fmt = useFormat();
  const traza = trazabilidadLote(batch);
  const ddmm = (iso: string) => fmt.fecha(iso).slice(0, 5);
  const { jars, inoculacionGrano } = batch;
  const nombreGrano =
    typeof inoculacionGrano.tipoGranoId === "object" ? inoculacionGrano.tipoGranoId.nombre : "—";
  const incubando = traza.incubacion.filter((r) => r.estado === "incubando").length;
  const fructificando = traza.fructificacion.filter((r) => r.estado === "fructificando").length;
  const fechasOleadas = [...new Set(traza.oleadas.map((x) => ddmm(x.oleada.fecha)))];

  const etapas: Etapa[] = [
    {
      key: "origen",
      icon: FlaskIcon,
      detail: traza.origen ? (
        <>
          {t("origenFrasco", { hongo: batch.fungusTypeId.nombre })}{" "}
          <Link href="/trazabilidad" className="text-accent-300 hover:text-accent-100">
            {traza.origen.numeroGuia}
          </Link>
          .
        </>
      ) : (
        <>
          {t("sinOrigen", { hongo: batch.fungusTypeId.nombre })}{" "}
          <Link href="/trazabilidad" className="text-accent-300 hover:text-accent-100">
            {t("verArbol")}
          </Link>
        </>
      ),
    },
    {
      key: "inoculacion",
      icon: GrainsIcon,
      fecha: ddmm(inoculacionGrano.fechaInicio),
      detail: t("inoculacionDetalle", {
        grano: nombreGrano,
        peso: fmt.kg(inoculacionGrano.pesoGranoKg),
        frascos: jars.length,
        contaminados: traza.contaminados,
      }),
      chips: jars.map((j) => (
        <StatusTag key={j._id} kind="jar" estado={j.estado} className="tabular-nums">
          {codigoCorto(j.numeroGuia)} · {tEstados(`jar.${j.estado}`)}
        </StatusTag>
      )),
    },
    {
      key: "incubacion",
      icon: PackageIcon,
      fecha: traza.incubacion[0]
        ? t("desde", { fecha: ddmm(traza.incubacion[0].fechaInicioIncubacion) })
        : undefined,
      detail: traza.incubacion.length
        ? t("incubacionDetalle", { count: traza.incubacion.length, activos: incubando })
        : t("incubacionVacia"),
      rows: traza.incubacion.map((r) => {
        const dias = diasIncubacion(r);
        return {
          id: codigoCorto(r.numeroSeguimiento),
          text: t("incubacionFila", {
            frascos: getOrigenFrascosLabel(r)
              .split(", ")
              .map(codigoCorto)
              .join(" + "),
            sustrato: nombreSustrato(r),
            peso: fmt.kg(r.pesoSustratoKg),
          }),
          end:
            r.estado === "incubando"
              ? t("diaDe", { dia: dias ?? 0, total: r.diasEsperadosIncubacion })
              : dias != null
                ? t("dias", { count: dias })
                : tEstados(`recipiente.${r.estado}`),
        };
      }),
    },
    {
      key: "fructificacion",
      icon: PlantIcon,
      fecha: traza.fructificacion[0]
        ? t("desde", { fecha: ddmm(traza.fructificacion[0].fechaInicioFructificacion!) })
        : undefined,
      detail: traza.fructificacion.length
        ? t("fructificacionDetalle", { count: traza.fructificacion.length, activos: fructificando })
        : t("fructificacionVacia"),
      rows: traza.fructificacion.map((r) => ({
        id: codigoCorto(r.numeroSeguimiento),
        text: t("desde", { fecha: ddmm(r.fechaInicioFructificacion!) }),
        end: tEstados(`recipiente.${r.estado}`),
      })),
    },
    {
      key: "cosecha",
      icon: ScalesIcon,
      fecha: fechasOleadas.join(" · ") || undefined,
      detail: traza.oleadas.length
        ? t("cosechaDetalle", { count: traza.oleadas.length, peso: fmt.kg(traza.pesoTotal) })
        : t("cosechaVacia"),
      rows: traza.oleadas.map(({ recipiente, oleada }) => ({
        id: codigoCorto(recipiente.numeroSeguimiento),
        text: fmt.fecha(oleada.fecha),
        end: fmt.kg(oleada.pesoKg),
      })),
    },
  ];

  return (
    <section className="rounded-lg bg-surface-card px-5 pt-[18px] pb-1 shadow-sm">
      <div className="pb-[18px]">
        <h2 className="m-0 text-base font-medium">{t("title")}</h2>
        <div className="mt-1 text-[12.5px] text-text-muted">
          {t("summary", {
            completas: traza.completas,
            total: etapas.length,
            peso: fmt.kg(traza.pesoTotal),
          })}
        </div>
      </div>

      <ol className="m-0 list-none p-0">
        {etapas.map((e, i) => {
          const state = traza.etapas[e.key];
          const last = i === etapas.length - 1;
          const nextPending = !last && traza.etapas[etapas[i + 1].key] === "pending";
          return (
            <li key={e.key} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3.5">
              <div className="flex flex-col items-center">
                <EtapaDot state={state} icon={e.icon} />
                {!last && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-1 w-0 flex-1 border-l",
                      nextPending || state === "pending"
                        ? "border-dashed border-neutral-700"
                        : "border-accent-800"
                    )}
                  />
                )}
              </div>
              <div
                className={cn(
                  "flex min-w-0 flex-col gap-1.5 pt-[3px] pb-5",
                  state === "pending" && "opacity-60"
                )}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-medium">{t(`etapa.${e.key}`)}</span>
                    {state === "active" && <Badge>{t("enCurso")}</Badge>}
                    {state === "pending" && <Badge variant="outline">{t("pendiente")}</Badge>}
                  </div>
                  {e.fecha && (
                    <span className="text-xs whitespace-nowrap text-text-subtle tabular-nums">
                      {e.fecha}
                    </span>
                  )}
                </div>
                <div className="text-[12.5px] text-pretty text-text-muted">{e.detail}</div>
                {e.rows && e.rows.length > 0 && (
                  <div className="flex flex-col gap-1 text-[12.5px] tabular-nums">
                    {e.rows.map((r, j) => (
                      <div
                        key={`${r.id}-${j}`}
                        className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-baseline gap-2.5"
                      >
                        <span className="font-medium">{r.id}</span>
                        <span className="truncate text-text-muted">{r.text}</span>
                        <span className="text-right text-text-subtle">{r.end}</span>
                      </div>
                    ))}
                  </div>
                )}
                {e.chips && <div className="flex flex-wrap gap-1">{e.chips}</div>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function EtapaDot({ state, icon: IconCmp }: { state: StepState; icon: Icon }) {
  return (
    <span
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full border",
        state === "pending"
          ? "border-dashed border-neutral-600 bg-transparent text-text-subtle"
          : "bg-accent-900 text-accent-200",
        state === "done" && "border-accent-700",
        state === "active" &&
          "border-accent shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_18%,transparent)]"
      )}
    >
      <IconCmp className="size-3.5" aria-hidden="true" />
    </span>
  );
}
