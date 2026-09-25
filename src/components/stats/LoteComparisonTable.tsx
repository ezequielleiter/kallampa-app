"use client";

import { useTranslations } from "next-intl";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { StatusTag } from "@/components/kallampa/StatusTag";
import { useFormat } from "@/components/kallampa/useFormat";
import type { StatsLote } from "@/lib/types";

interface LoteComparisonTableProps {
  lotes: StatsLote[];
}

// v2: un lote puede tener varios recipientes con fechas/etapas
// independientes ("una etapa = una columna" ya no tiene sentido), por eso
// se muestran promedios agregados en vez de columnas por etapa fija.
export function LoteComparisonTable({ lotes }: LoteComparisonTableProps) {
  const t = useTranslations("components.loteComparisonTable");
  const fmt = useFormat();
  const dias = (d: number | null) => (d === null ? "—" : `${fmt.number(d)} d`);
  return (
    <Table minWidth={900}>
      <TableHeader>
        <TableRow>
          <TableHead>{t("lote")}</TableHead>
          <TableHead>{t("hongo")}</TableHead>
          <TableHead>{t("estado")}</TableHead>
          <TableHead className="text-right">{t("diasTotales")}</TableHead>
          <TableHead className="text-right">{t("diasIncubacionProm")}</TableHead>
          <TableHead className="text-right">{t("diasFructificacionProm")}</TableHead>
          <TableHead className="text-right">{t("pesoCosechado")}</TableHead>
          <TableHead className="text-right">{t("eficienciaBiologica")}</TableHead>
          <TableHead className="text-right">{t("costoTotal")}</TableHead>
          <TableHead className="text-right">{t("costoPorKg")}</TableHead>
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
                <StatusTag kind="lote" estado={r.estadoDerivado} />
              </TableCell>
              <TableCell className="text-right">{dias(r.diasTotales)}</TableCell>
              <TableCell className="text-right">{dias(r.diasIncubacionPromedio)}</TableCell>
              <TableCell className="text-right">{dias(r.diasFructificacionPromedio)}</TableCell>
              <TableCell className="text-right">{fmt.kg(r.pesoTotalCosechado)}</TableCell>
              <TableCell className="text-right">{fmt.pct(r.eficienciaBiologica)}</TableCell>
              <TableCell className="text-right">{fmt.money(r.costoProduccion.costoTotal)}</TableCell>
              <TableCell className="text-right">
                {fmt.money(r.costoProduccion.costoPorKgProducido)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
