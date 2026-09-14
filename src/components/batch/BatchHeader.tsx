"use client";

import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BATCH_ESTADO_COLORS, BATCH_ESTADO_LABELS } from "@/lib/constants";
import type { ResumenLote } from "@/lib/metrics";
import type { Batch } from "@/lib/types";

interface BatchHeaderProps {
  batch: Batch;
  resumen: ResumenLote;
}

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

export function BatchHeader({ batch, resumen }: BatchHeaderProps) {
  const { costoProduccion } = resumen;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">{batch.numeroLote}</h1>
          <Badge
            className="text-white"
            style={{ backgroundColor: BATCH_ESTADO_COLORS[batch.estado] }}
          >
            {BATCH_ESTADO_LABELS[batch.estado]}
          </Badge>
          {resumen.alertaEtapaActual.demorado && (
            <Badge variant="destructive">
              <TriangleAlert /> Demorado {resumen.alertaEtapaActual.diasDeDemora} día(s)
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {batch.fungusTypeId?.nombre}
          {batch.fungusTypeId?.nombreCientifico ? ` (${batch.fungusTypeId.nombreCientifico})` : ""}
        </p>
        {batch.descartado && batch.motivoDescarte && (
          <p className="text-sm text-destructive">Motivo de descarte: {batch.motivoDescarte}</p>
        )}

        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-4">
          <Metric label="Días totales" value={resumen.diasTotales ?? "—"} />
          <Metric
            label="Eficiencia biológica"
            value={
              resumen.eficienciaBiologica !== null
                ? `${resumen.eficienciaBiologica.toFixed(1)}%`
                : "—"
            }
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
