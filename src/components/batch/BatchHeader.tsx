"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { TreeStructureIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/kallampa/StatusTag";
import { Stepper } from "@/components/kallampa/Stepper";
import { KpiGrid } from "@/components/kallampa/Kpi";
import { useFormat } from "@/components/kallampa/useFormat";
import type { EstadoDerivado } from "@/lib/constants";
import type { BatchDetail } from "@/lib/types";
import type { CostoProduccionBatch } from "@/lib/recipiente-utils";
import { etapasLote } from "./lote-view";

interface BatchHeaderProps {
  batch: BatchDetail;
  estadoDerivado: EstadoDerivado;
  alertas: number;
  pesoTotalCosechado: number;
  eficienciaBiologica: number | null;
  costoProduccion: CostoProduccionBatch;
}

export function BatchHeader({
  batch,
  estadoDerivado,
  alertas,
  pesoTotalCosechado,
  eficienciaBiologica,
  costoProduccion,
}: BatchHeaderProps) {
  const t = useTranslations("components.batchHeader");
  const fmt = useFormat();
  const { jars, recipientes } = batch;
  const etapas = etapasLote(jars, recipientes);
  const fructificando = recipientes.filter((r) => r.estado === "fructificando").length;

  return (
    <section className="rounded-lg bg-surface-card px-5 py-[18px] shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="m-0 text-[22px] leading-tight font-medium tracking-[-0.015em] tabular-nums">
              {batch.numeroLote}
            </h1>
            <StatusTag kind="lote" estado={estadoDerivado} />
            {alertas > 0 && (
              <Badge variant="destructive">
                <WarningCircleIcon /> {t("alertas", { count: alertas })}
              </Badge>
            )}
          </div>
          <p className="mt-1.5 mb-0 text-[13px] text-text-muted">
            {batch.fungusTypeId?.nombre}
            {batch.fungusTypeId?.nombreCientifico && (
              <>
                {" · "}
                <i>{batch.fungusTypeId.nombreCientifico}</i>
              </>
            )}
            {" · "}
            {t("inoculadoEl")} {fmt.fecha(batch.inoculacionGrano.fechaInicio)}
            {" · "}
            {t("frascos", { count: batch.inoculacionGrano.cantidadFrascos })}
            {typeof batch.origenFrascoLiquidoId === "object" && (
              <>
                {" · "}
                {t("desdeMicelioLiquido")}{" "}
                <span className="tabular-nums">{batch.origenFrascoLiquidoId.numeroGuia}</span>
              </>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" render={<Link href="/trazabilidad" />}>
          <TreeStructureIcon /> {t("verTrazabilidad")}
        </Button>
      </div>

      <div className="mt-5">
        <Stepper
          steps={[
            {
              name: t("etapaInoculacion"),
              meta: t("metaInoculacion", {
                fecha: fmt.fecha(batch.inoculacionGrano.fechaInicio).slice(0, 5),
                count: jars.length,
              }),
              state: etapas.inoculacion,
            },
            {
              name: t("etapaIncubacion"),
              meta: t("metaIncubacion", { count: recipientes.length }),
              state: etapas.incubacion,
            },
            {
              name: t("etapaFructificacion"),
              meta: t("metaFructificacion", { count: fructificando }),
              state: etapas.fructificacion,
            },
            {
              name: t("etapaCosecha"),
              meta: fmt.kg(pesoTotalCosechado),
              state: etapas.cosecha,
            },
          ]}
        />
      </div>

      <KpiGrid
        className="mt-[18px] border-t border-divider pt-4"
        items={[
          { label: t("pesoCosechado"), value: fmt.kg(pesoTotalCosechado) },
          { label: t("eficienciaBiologica"), value: fmt.pct(eficienciaBiologica) },
          {
            label: t("costoTotal"),
            value: costoProduccion.costoTotal > 0 ? fmt.money(costoProduccion.costoTotal) : "—",
          },
          {
            label: t("costoPorKgProducido"),
            value: fmt.money(costoProduccion.costoPorKgProducido),
          },
        ]}
      />
    </section>
  );
}
