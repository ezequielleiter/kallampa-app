"use client";

import { cn } from "@/lib/utils";
import { formatFechaCorta } from "@/lib/format";
import { BATCH_ESTADO_COLORS, BATCH_ESTADO_LABELS } from "@/lib/constants";
import type { ResumenLote } from "@/lib/metrics";
import type { Batch } from "@/lib/types";

interface BatchTimelineProps {
  batch: Batch;
  resumen: ResumenLote;
}

function formatDate(value?: string) {
  if (!value) return null;
  try {
    return formatFechaCorta(value) || null;
  } catch {
    return null;
  }
}

export function BatchTimeline({ batch, resumen }: BatchTimelineProps) {
  // Solo las 4 etapas "productivas" (finalizado no tiene su propio subdocumento).
  const etapas: {
    key: "inoculacion_grano" | "crecimiento_sustrato" | "fructificacion" | "cosecha";
    fechaInicio?: string;
    fechaFin?: string;
    diasEsperados?: number;
    diasTranscurridos: number | null;
    alcanzada: boolean;
  }[] = [
    {
      key: "inoculacion_grano",
      fechaInicio: batch.inoculacionGrano.fechaInicio,
      fechaFin: batch.inoculacionGrano.fechaFin,
      diasEsperados: batch.inoculacionGrano.diasEsperados,
      diasTranscurridos: resumen.diasPorEtapa.inoculacionGrano,
      alcanzada: true,
    },
    {
      key: "crecimiento_sustrato",
      fechaInicio: batch.crecimientoSustrato?.fechaInicio,
      fechaFin: batch.crecimientoSustrato?.fechaFin,
      diasEsperados: batch.crecimientoSustrato?.diasEsperados,
      diasTranscurridos: resumen.diasPorEtapa.crecimientoSustrato,
      alcanzada: !!batch.crecimientoSustrato?.fechaInicio,
    },
    {
      key: "fructificacion",
      fechaInicio: batch.fructificacion?.fechaInicio,
      fechaFin: batch.fructificacion?.fechaFin,
      diasEsperados: batch.fructificacion?.diasEsperados,
      diasTranscurridos: resumen.diasPorEtapa.fructificacion,
      alcanzada: !!batch.fructificacion?.fechaInicio,
    },
    {
      key: "cosecha",
      fechaInicio: batch.cosecha?.fechaInicio,
      fechaFin: batch.cosecha?.fechaFin,
      diasEsperados: batch.cosecha?.diasEsperados,
      diasTranscurridos: resumen.diasPorEtapa.cosecha,
      alcanzada: !!batch.cosecha?.fechaInicio,
    },
  ];

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {etapas.map((etapa) => {
        const activa = batch.estado === etapa.key;

        return (
          <div
            key={etapa.key}
            className={cn(
              "flex flex-1 flex-col gap-1 rounded-lg border p-2.5",
              activa ? "border-foreground/30 bg-muted/50" : "border-border",
              !etapa.alcanzada && "opacity-40"
            )}
          >
            <div className="flex items-center gap-1.5">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: BATCH_ESTADO_COLORS[etapa.key] }}
              />
              <span className="text-xs font-semibold">{BATCH_ESTADO_LABELS[etapa.key]}</span>
            </div>
            {etapa.alcanzada ? (
              <>
                <span className="text-xs text-muted-foreground">
                  Inicio: {formatDate(etapa.fechaInicio) ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Fin: {formatDate(etapa.fechaFin) ?? (activa ? "en curso" : "—")}
                </span>
                <span className="text-xs">
                  {etapa.diasTranscurridos ?? "—"} día(s)
                  {etapa.diasEsperados ? ` / esperados: ${etapa.diasEsperados}` : ""}
                </span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">Pendiente</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
