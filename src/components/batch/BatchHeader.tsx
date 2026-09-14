"use client";

import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatFechaCorta } from "@/lib/format";
import {
  ESTADO_DERIVADO_BADGE_VARIANT,
  ESTADO_DERIVADO_LABELS,
  type EstadoDerivado,
} from "@/lib/constants";
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
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">{batch.numeroLote}</h1>
          <Badge variant={ESTADO_DERIVADO_BADGE_VARIANT[estadoDerivado]}>
            {ESTADO_DERIVADO_LABELS[estadoDerivado]}
          </Badge>
          {alertas > 0 && (
            <Badge variant="destructive">
              <TriangleAlert /> {alertas} alerta{alertas === 1 ? "" : "s"}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {batch.fungusTypeId?.nombre}
          {batch.fungusTypeId?.nombreCientifico ? ` (${batch.fungusTypeId.nombreCientifico})` : ""}
          {" · Inoculado el "}
          {formatFechaCorta(batch.inoculacionGrano.fechaInicio)}
          {" · "}
          {batch.inoculacionGrano.cantidadFrascos} frasco(s)
        </p>

        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-4">
          <Metric label="Peso cosechado" value={`${pesoTotalCosechado.toFixed(2)} kg`} />
          <Metric
            label="Eficiencia biológica"
            value={eficienciaBiologica !== null ? `${eficienciaBiologica.toFixed(1)}%` : "—"}
          />
          <Metric
            label="Costo total"
            value={costoProduccion.costoTotal > 0 ? currency.format(costoProduccion.costoTotal) : "—"}
          />
          <Metric
            label="Costo por kg producido"
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
