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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  async function handleEstadoChange(placaId: string, estado: PlacaEstado) {
    try {
      await apiFetch(`/api/placas/${placaId}`, {
        method: "PATCH",
        body: JSON.stringify({ estado }),
      });
      toast.success(t("successMessage"));
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorMessage"));
    }
  }

  if (placas.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("emptyState")}</p>;
  }

  return (
    <Table>
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
              <Select
                items={PLACA_ESTADOS.map((estado) => ({
                  label: tEstado(estado),
                  value: estado,
                }))}
                value={placa.estado}
                onValueChange={(v) => handleEstadoChange(placa._id, v as PlacaEstado)}
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLACA_ESTADOS.map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {tEstado(estado)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
