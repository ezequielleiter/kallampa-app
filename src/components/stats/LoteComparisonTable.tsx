"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { BATCH_ESTADO_LABELS } from "@/lib/constants";
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

export function LoteComparisonTable({ lotes }: LoteComparisonTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Lote</TableHead>
          <TableHead>Hongo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Días grano</TableHead>
          <TableHead>Días sustrato</TableHead>
          <TableHead>Días fructif.</TableHead>
          <TableHead>Días cosecha</TableHead>
          <TableHead>Días totales</TableHead>
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
              <TableCell>{BATCH_ESTADO_LABELS[l.estado]}</TableCell>
              <TableCell>{fmtDias(r.diasPorEtapa.inoculacionGrano)}</TableCell>
              <TableCell>{fmtDias(r.diasPorEtapa.crecimientoSustrato)}</TableCell>
              <TableCell>{fmtDias(r.diasPorEtapa.fructificacion)}</TableCell>
              <TableCell>{fmtDias(r.diasPorEtapa.cosecha)}</TableCell>
              <TableCell>{fmtDias(r.diasTotales)}</TableCell>
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
