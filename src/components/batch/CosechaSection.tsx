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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { RECIPIENTE_ESTADO_BADGE_VARIANT, RECIPIENTE_ESTADO_LABELS } from "@/lib/constants";
import { pesoCosechadoRecipiente } from "@/lib/recipiente-utils";
import type { Oleada, Recipiente } from "@/lib/types";
import { OleadaFormDialog } from "./OleadaFormDialog";
import { RecipienteEstadoDialog } from "./RecipienteEstadoDialog";

interface CosechaSectionProps {
  recipientes: Recipiente[];
  onChanged: () => void;
}

export function CosechaSection({ recipientes, onChanged }: CosechaSectionProps) {
  const cosechables = recipientes.filter(
    (r) => r.estado === "fructificando" || r.estado === "finalizado"
  );

  if (cosechables.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay recipientes en fructificación ni finalizados.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {cosechables.map((r) => (
        <RecipienteCosecha key={r._id} recipiente={r} onChanged={onChanged} />
      ))}
    </div>
  );
}

function RecipienteCosecha({
  recipiente,
  onChanged,
}: {
  recipiente: Recipiente;
  onChanged: () => void;
}) {
  const [dialogTarget, setDialogTarget] = useState<Oleada | "new" | null>(null);
  const [finalizarOpen, setFinalizarOpen] = useState(false);

  const editable = recipiente.estado === "fructificando";
  const oleadas = [...recipiente.oleadas].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );
  const total = pesoCosechadoRecipiente(recipiente);

  async function handleDelete(oleada: Oleada) {
    if (!window.confirm(`¿Eliminar la oleada del ${formatFechaCorta(oleada.fecha)}?`)) return;
    try {
      await apiFetch<Recipiente>(
        `/api/recipientes/${recipiente._id}/oleadas/${oleada._id}`,
        { method: "DELETE" }
      );
      toast.success("Oleada eliminada");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar la oleada");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          {recipiente.numeroSeguimiento}
          <Badge variant={RECIPIENTE_ESTADO_BADGE_VARIANT[recipiente.estado]}>
            {RECIPIENTE_ESTADO_LABELS[recipiente.estado]}
          </Badge>
        </CardTitle>
        <div className="flex items-center gap-2">
          {editable && (
            <Button size="sm" onClick={() => setDialogTarget("new")}>
              <Plus /> Agregar oleada
            </Button>
          )}
          {editable && (
            <Button size="sm" variant="outline" onClick={() => setFinalizarOpen(true)}>
              Marcar finalizado
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {oleadas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no se registraron oleadas.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Peso (kg)</TableHead>
                <TableHead>Notas</TableHead>
                {editable && <TableHead className="w-8" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {oleadas.map((oleada, i) => (
                <TableRow key={oleada._id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>{formatFechaCorta(oleada.fecha)}</TableCell>
                  <TableCell>{oleada.pesoKg.toFixed(2)}</TableCell>
                  <TableCell className="max-w-40 truncate text-muted-foreground">
                    {oleada.notas}
                  </TableCell>
                  {editable && (
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
                  )}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell>{total.toFixed(2)}</TableCell>
                <TableCell colSpan={editable ? 2 : 1} />
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </CardContent>

      {dialogTarget && (
        <OleadaFormDialog
          key={dialogTarget === "new" ? "new" : dialogTarget._id}
          open={!!dialogTarget}
          onOpenChange={(open) => {
            if (!open) setDialogTarget(null);
          }}
          recipienteId={recipiente._id}
          oleada={dialogTarget === "new" ? undefined : dialogTarget}
          onSuccess={onChanged}
        />
      )}

      <RecipienteEstadoDialog
        open={finalizarOpen}
        onOpenChange={setFinalizarOpen}
        recipienteId={recipiente._id}
        numeroSeguimiento={recipiente.numeroSeguimiento}
        estadoObjetivo="finalizado"
        onSuccess={onChanged}
      />
    </Card>
  );
}
