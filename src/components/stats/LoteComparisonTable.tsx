"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ESTADO_DERIVADO_BADGE_VARIANT, ESTADO_DERIVADO_LABELS } from "@/lib/constants";
import type { StatsLote } from "@/lib/types";

interface LoteComparisonTableProps {
  lotes: StatsLote[];
}

function fmtDias(d: number | null) {
  return d === null ? "—" : `${d} d`;
}

function fmtPercent(n: number | null) {
  return n === null ? "—" : `${n.toFixed(1)}%`;
}

function fmtMoney(n: number | null) {
  return n === null ? "—" : `$${n.toFixed(0)}`;
}

// v2: un lote puede tener varios recipientes con fechas/etapas
// independientes ("una etapa = una columna" ya no tiene sentido), por eso
// se muestran promedios agregados en vez de columnas por etapa fija.
export function LoteComparisonTable({ lotes }: LoteComparisonTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Lote</TableHead>
          <TableHead>Hongo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Días totales</TableHead>
          <TableHead>Días incubación (prom.)</TableHead>
          <TableHead>Días fructificación (prom.)</TableHead>
          <TableHead>Peso cosechado</TableHead>
          <TableHead>Eficiencia biológica</TableHead>
          <TableHead>Costo total</TableHead>
          <TableHead>Costo/kg</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lotes.map((l) => {
          const r = l.resumen;
          return (
            <TableRow key={l._id}>
              <TableCell className="font-medium">{l.numeroLote}</TableCell>
              <TableCell>{l.fungusTypeId?.nombre}</TableCell>
              <TableCell>
                <Badge variant={ESTADO_DERIVADO_BADGE_VARIANT[r.estadoDerivado]}>
                  {ESTADO_DERIVADO_LABELS[r.estadoDerivado]}
                </Badge>
              </TableCell>
              <TableCell>{fmtDias(r.diasTotales)}</TableCell>
              <TableCell>{fmtDias(r.diasIncubacionPromedio)}</TableCell>
              <TableCell>{fmtDias(r.diasFructificacionPromedio)}</TableCell>
              <TableCell>{r.pesoTotalCosechado.toFixed(2)} kg</TableCell>
              <TableCell>{fmtPercent(r.eficienciaBiologica)}</TableCell>
              <TableCell>${r.costoProduccion.costoTotal.toFixed(0)}</TableCell>
              <TableCell>{fmtMoney(r.costoProduccion.costoPorKgProducido)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
