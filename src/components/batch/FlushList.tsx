"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FlushFormDialog } from "./FlushForm";
import { apiFetch } from "@/lib/api-client";
import { formatFechaCorta } from "@/lib/format";
import type { Batch, Oleada } from "@/lib/types";
import type { ResumenLote } from "@/lib/metrics";

interface FlushListProps {
  batch: Batch;
  resumen: ResumenLote;
  onChanged: () => void;
}

export function FlushList({ batch, resumen, onChanged }: FlushListProps) {
  const [dialogTarget, setDialogTarget] = useState<Oleada | "new" | null>(null);

  const puedeAgregar = batch.estado === "cosecha";
  const oleadas = [...batch.oleadas].sort((a, b) => a.numero - b.numero);
  const rendimientoPorNumero = new Map(resumen.rendimientoPorOleada.map((r) => [r.numero, r]));

  async function handleDelete(oleada: Oleada) {
    if (!window.confirm(`¿Eliminar la oleada N° ${oleada.numero}?`)) return;
    try {
      await apiFetch<Batch>(`/api/batches/${batch._id}/flushes/${oleada._id}`, {
        method: "DELETE",
      });
      toast.success("Oleada eliminada");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar la oleada");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Oleadas de cosecha</h2>
        {puedeAgregar && (
          <Button size="sm" onClick={() => setDialogTarget("new")}>
            <Plus /> Agregar oleada
          </Button>
        )}
      </div>

      {oleadas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no se registraron oleadas.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Peso (kg)</TableHead>
              <TableHead>% del total</TableHead>
              <TableHead>Notas</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {oleadas.map((oleada) => (
              <TableRow key={oleada._id}>
                <TableCell>{oleada.numero}</TableCell>
                <TableCell>{formatFechaCorta(oleada.fecha)}</TableCell>
                <TableCell>{oleada.pesoKg.toFixed(2)}</TableCell>
                <TableCell>
                  {(rendimientoPorNumero.get(oleada.numero)?.porcentajeDelTotal ?? 0).toFixed(1)}%
                </TableCell>
                <TableCell className="max-w-40 truncate text-muted-foreground">
                  {oleada.notas}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal />
                        </Button>
                      }
                    />
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setDialogTarget(oleada)}>
                        <Pencil /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleDelete(oleada)}
                      >
                        <Trash2 /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>Total</TableCell>
              <TableCell>{resumen.pesoTotalCosechado.toFixed(2)}</TableCell>
              <TableCell colSpan={3} />
            </TableRow>
          </TableFooter>
        </Table>
      )}

      {dialogTarget && (
        <FlushFormDialog
          key={dialogTarget === "new" ? "new" : dialogTarget._id}
          open={!!dialogTarget}
          onOpenChange={(open) => {
            if (!open) setDialogTarget(null);
          }}
          batchId={batch._id}
          flush={dialogTarget === "new" ? undefined : dialogTarget}
          siguienteNumero={oleadas.length > 0 ? Math.max(...oleadas.map((o) => o.numero)) + 1 : 1}
          onSuccess={onChanged}
        />
      )}
    </div>
  );
}
