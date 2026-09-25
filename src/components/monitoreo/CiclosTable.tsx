"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/kallampa/PageHeader";
import { useFormat } from "@/components/kallampa/useFormat";
import { computeCycles, type Ciclo } from "@/lib/monitoreo/ciclos";
import type { Rango, SerieRow, TipoSerie } from "@/lib/monitoreo/tipos";
import { formatDuracion, formatHora } from "./formato";

/**
 * Ciclos del actuador (rachas de ventanas prendidas), del mas nuevo al mas
 * viejo, con fila de promedios. Ver `computeCycles` para los calculos.
 */
export function CiclosTable({
  rows,
  windowSec,
  range,
  hasta,
  unit,
  tipo,
}: {
  rows: SerieRow[];
  windowSec: number;
  range: Rango;
  hasta: number;
  unit: string;
  tipo: TipoSerie;
}) {
  const t = useTranslations("components.monitoreo");
  const fmt = useFormat();
  const { ciclos, promedios } = useMemo(
    () => computeCycles(rows, windowSec, hasta),
    [rows, windowSec, hasta]
  );

  const dur = (seg: number) => formatDuracion(seg, fmt.number);
  const ritmo = (v: number | null) => (v == null ? "—" : `${fmt.number(v, 2)} ${unit}/min`);
  const cae = (v: number | null) => (v == null ? "—" : `${fmt.number(v, 1)} ${unit}/h`);
  const mantuvo = (c: Ciclo) =>
    c.mantuvo.tipo === "hasta_proximo"
      ? dur(c.mantuvo.seg)
      : c.mantuvo.tipo === "prendida_ahora"
        ? t("prendidaAhora", { tipo })
        : t("enCurso", { duracion: dur(c.mantuvo.seg) });
  const sube = (c: Ciclo) =>
    c.subeDesde == null || c.subeHasta == null
      ? "—"
      : `${fmt.number(c.subeDesde, 1)} → ${fmt.number(c.subeHasta, 1)} ${unit}`;

  return (
    <div>
      <h3 className="m-0 mb-1 text-[13.5px] font-medium">{t("ciclosTitle")}</h3>
      {ciclos.length === 0 ? (
        <EmptyState className="py-4">{t("sinCiclos")}</EmptyState>
      ) : (
        <Table minWidth={620}>
          <TableHeader>
            <TableRow>
              <TableHead>{t("colInicio")}</TableHead>
              <TableHead className="text-right">{t("colPrendida")}</TableHead>
              <TableHead>{t("colSube")}</TableHead>
              <TableHead className="text-right">{t("colRitmo", { unit })}</TableHead>
              <TableHead className="text-right">{t("colMantuvo")}</TableHead>
              <TableHead className="text-right">{t("colCae")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ciclos.map((c) => (
              <TableRow key={c.inicio}>
                <TableCell>{formatHora(c.inicio, range)}</TableCell>
                <TableCell className="text-right">{dur(c.prendidaSeg)}</TableCell>
                <TableCell>{sube(c)}</TableCell>
                <TableCell className="text-right">{ritmo(c.ritmoPorMin)}</TableCell>
                <TableCell className="text-right">{mantuvo(c)}</TableCell>
                <TableCell className="text-right">{cae(c.caePorHora)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="hover:bg-none">
              <TableCell className="text-text-muted">{t("promedios")}</TableCell>
              <TableCell className="text-right">
                {promedios.prendidaSeg == null ? "—" : dur(promedios.prendidaSeg)}
              </TableCell>
              <TableCell />
              <TableCell className="text-right">{ritmo(promedios.ritmoPorMin)}</TableCell>
              <TableCell className="text-right">
                {promedios.mantuvoSeg == null ? "—" : dur(promedios.mantuvoSeg)}
              </TableCell>
              <TableCell className="text-right">{cae(promedios.caePorHora)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )}
      <p className="mt-2 mb-0 text-xs leading-[17px] text-text-subtle">
        {t("ciclosNota", { w: fmt.number(windowSec / 60, windowSec % 60 ? 1 : 0) })}
      </p>
    </div>
  );
}
