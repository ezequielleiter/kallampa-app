"use client";

import { toast } from "sonner";
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
import { PLACA_ESTADOS, PLACA_ESTADO_LABELS, type PlacaEstado } from "@/lib/constants";
import { apiFetch } from "@/lib/api-client";
import type { Placa } from "@/lib/types";

interface PlacasGridProps {
  placas: Placa[];
  onChanged: () => void;
}

export function PlacasGrid({ placas, onChanged }: PlacasGridProps) {
  async function handleEstadoChange(placaId: string, estado: PlacaEstado) {
    try {
      await apiFetch(`/api/placas/${placaId}`, {
        method: "PATCH",
        body: JSON.stringify({ estado }),
      });
      toast.success("Placa actualizada");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar la placa");
    }
  }

  if (placas.length === 0) {
    return <p className="text-sm text-muted-foreground">Esta clonación no tiene placas.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>N° de placa</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {placas.map((placa) => (
          <TableRow key={placa._id}>
            <TableCell className="font-medium">{placa.numeroPlaca}</TableCell>
            <TableCell>
              <Select
                items={PLACA_ESTADOS.map((estado) => ({
                  label: PLACA_ESTADO_LABELS[estado],
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
                      {PLACA_ESTADO_LABELS[estado]}
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
