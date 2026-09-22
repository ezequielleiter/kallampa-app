"use client";

import { useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatFechaCorta } from "@/lib/format";
import { ESTADO_DERIVADO_BADGE_VARIANT, type EstadoDerivado } from "@/lib/constants";
import type { Batch } from "@/lib/types";
import type { CostoProduccionBatch } from "@/lib/recipiente-utils";

interface BatchHeaderProps {
  batch: Batch;
  estadoDerivado: EstadoDerivado;
  alertas: number;
  pesoTotalCosechado: number;
  eficienciaBiologica: number | null;
  costoProduccion: CostoProduccionBatch;
}

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

export function BatchHeader({
  batch,
  estadoDerivado,
  alertas,
  pesoTotalCosechado,
  eficienciaBiologica,
  costoProduccion,
}: BatchHeaderProps) {
  const t = useTranslations("components.batchHeader");
  const tEstado = useTranslations("estados.lote");
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">{batch.numeroLote}</h1>
          <Badge variant={ESTADO_DERIVADO_BADGE_VARIANT[estadoDerivado]}>
            {tEstado(estadoDerivado)}
          </Badge>
          {alertas > 0 && (
            <Badge variant="destructive">
              <TriangleAlert /> {t("alertas", { count: alertas })}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {batch.fungusTypeId?.nombre}
          {batch.fungusTypeId?.nombreCientifico ? ` (${batch.fungusTypeId.nombreCientifico})` : ""}
          {" · "}
          {t("inoculadoEl")}{" "}
          {formatFechaCorta(batch.inoculacionGrano.fechaInicio)}
          {" · "}
          {t("frascos", { count: batch.inoculacionGrano.cantidadFrascos })}
          {typeof batch.origenFrascoLiquidoId === "object" && (
            <>
              {" · "}
              {t("desdeMicelioLiquido")}{" "}
              {batch.origenFrascoLiquidoId.numeroGuia}
            </>
          )}
        </p>

        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-4">
          <Metric label={t("pesoCosechado")} value={`${pesoTotalCosechado.toFixed(2)} kg`} />
          <Metric
            label={t("eficienciaBiologica")}
            value={eficienciaBiologica !== null ? `${eficienciaBiologica.toFixed(1)}%` : "—"}
          />
          <Metric
            label={t("costoTotal")}
            value={costoProduccion.costoTotal > 0 ? currency.format(costoProduccion.costoTotal) : "—"}
          />
          <Metric
            label={t("costoPorKgProducido")}
            value={
              costoProduccion.costoPorKgProducido !== null
                ? currency.format(costoProduccion.costoPorKgProducido)
                : "—"
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
