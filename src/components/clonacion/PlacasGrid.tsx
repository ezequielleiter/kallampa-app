"use client";

import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/kallampa/PageHeader";
import { StateSelect } from "@/components/kallampa/StateSelect";
import { PLACA_ESTADOS, type PlacaEstado } from "@/lib/constants";
import { apiFetch } from "@/lib/api-client";
import type { Placa } from "@/lib/types";

interface PlacasGridProps {
  placas: Placa[];
  onChanged: () => void;
}

export function PlacasGrid({ placas, onChanged }: PlacasGridProps) {
  const t = useTranslations("components.placasGrid");
  const tEstado = useTranslations("estados.placa");

  async function handleEstadoChange(placa: Placa, estado: PlacaEstado) {
    try {
      await apiFetch(`/api/placas/${placa._id}`, {
        method: "PATCH",
        body: JSON.stringify({ estado }),
      });
      toast.success(
        t("markedAs", { numero: placa.numeroPlaca, estado: tEstado(estado).toLowerCase() })
      );
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorMessage"));
    }
  }

  if (placas.length === 0) {
    return <EmptyState>{t("emptyState")}</EmptyState>;
  }

  return (
    <Table minWidth={360}>
      <TableHeader>
        <TableRow>
          <TableHead>{t("numeroPlaca")}</TableHead>
          <TableHead>{t("estado")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {placas.map((placa) => (
          <TableRow key={placa._id}>
            <TableCell className="font-medium">{placa.numeroPlaca}</TableCell>
            <TableCell>
              <StateSelect
                label={t("estadoDe", { numero: placa.numeroPlaca })}
                value={placa.estado}
                options={PLACA_ESTADOS.map((estado) => ({
                  value: estado,
                  label: tEstado(estado),
                }))}
                onChange={(v) => handleEstadoChange(placa, v as PlacaEstado)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
