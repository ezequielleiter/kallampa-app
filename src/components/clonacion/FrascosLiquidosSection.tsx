"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, MoreHorizontal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiFetch } from "@/lib/api-client";
import { formatFechaCorta } from "@/lib/format";
import {
  FRASCO_LIQUIDO_ESTADO_BADGE_VARIANT,
  FRASCO_LIQUIDO_ESTADO_LABELS,
  type FrascoLiquidoEstado,
} from "@/lib/constants";
import type { FrascoLiquido } from "@/lib/types";
import { NuevoFrascoLiquidoSheet } from "./NuevoFrascoLiquidoSheet";

interface FrascosLiquidosSectionProps {
  clonacionId: string;
  frascosLiquidos: FrascoLiquido[];
  onChanged: () => void;
  permiteAgregar: boolean;
}

export function FrascosLiquidosSection({
  clonacionId,
  frascosLiquidos,
  onChanged,
  permiteAgregar,
}: FrascosLiquidosSectionProps) {
  const [nuevoOpen, setNuevoOpen] = useState(false);

  async function handleMarcarEstado(frasco: FrascoLiquido, estado: FrascoLiquidoEstado) {
    try {
      await apiFetch(`/api/frascos-liquidos/${frasco._id}`, {
        method: "PATCH",
        body: JSON.stringify({ estado }),
      });
      toast.success(`Frasco marcado como ${FRASCO_LIQUIDO_ESTADO_LABELS[estado].toLowerCase()}`);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar el frasco");
    }
  }

  function placaOrigenLabel(frasco: FrascoLiquido): string {
    if (frasco.origenPlacaId === undefined) return "—";
    return typeof frasco.origenPlacaId === "object"
      ? frasco.origenPlacaId.numeroPlaca
      : frasco.origenPlacaId;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Frascos de micelio líquido ({frascosLiquidos.length})</h2>
        {permiteAgregar && (
          <Button size="sm" onClick={() => setNuevoOpen(true)}>
            <Plus /> Nuevo frasco
          </Button>
        )}
      </div>

      {frascosLiquidos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Esta clonación todavía no tiene frascos de micelio líquido.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° de guía</TableHead>
              <TableHead>Placa de origen</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {frascosLiquidos.map((frasco) => (
              <TableRow key={frasco._id}>
                <TableCell className="font-medium">{frasco.numeroGuia}</TableCell>
                <TableCell className="text-muted-foreground">{placaOrigenLabel(frasco)}</TableCell>
                <TableCell>{formatFechaCorta(frasco.fechaCreacion)}</TableCell>
                <TableCell>
                  <Badge variant={FRASCO_LIQUIDO_ESTADO_BADGE_VARIANT[frasco.estado]}>
                    {FRASCO_LIQUIDO_ESTADO_LABELS[frasco.estado]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {frasco.estado === "valido" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal />
                          </Button>
                        }
                      />
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleMarcarEstado(frasco, "vacio")}>
                          Marcar vacío
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMarcarEstado(frasco, "finalizado")}>
                          Marcar finalizado
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleMarcarEstado(frasco, "contaminado")}
                        >
                          Marcar contaminado
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {permiteAgregar && (
        <NuevoFrascoLiquidoSheet
          open={nuevoOpen}
          onOpenChange={setNuevoOpen}
          clonacionId={clonacionId}
          onSuccess={onChanged}
        />
      )}
    </div>
  );
}
