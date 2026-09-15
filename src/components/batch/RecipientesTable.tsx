"use client";

import { useState } from "react";
import { Plus, MoreHorizontal, TriangleAlert } from "lucide-react";
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
import { formatFechaCorta } from "@/lib/format";
import {
  RECIPIENTE_ESTADO_BADGE_VARIANT,
  RECIPIENTE_ESTADO_LABELS,
  RECIPIENTE_ESTADOS_TERMINALES,
} from "@/lib/constants";
import { alertaRecipiente, getOrigenFrascosLabel } from "@/lib/recipiente-utils";
import type { FungusType, Recipiente } from "@/lib/types";
import { NuevoRecipienteSheet } from "./NuevoRecipienteSheet";
import { FructificarSheet } from "./FructificarSheet";
import { RecipienteEstadoDialog } from "./RecipienteEstadoDialog";

interface RecipientesTableProps {
  batchId: string;
  fungusType: FungusType;
  recipientes: Recipiente[];
  onChanged: () => void;
}

type EstadoObjetivo = "finalizado" | "contaminado" | "descartado";

export function RecipientesTable({
  batchId,
  fungusType,
  recipientes,
  onChanged,
}: RecipientesTableProps) {
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [fructificarTarget, setFructificarTarget] = useState<Recipiente | null>(null);
  const [estadoTarget, setEstadoTarget] = useState<{
    recipiente: Recipiente;
    estado: EstadoObjetivo;
  } | null>(null);

  function nombreSustrato(r: Recipiente) {
    return typeof r.tipoSustratoId === "object" ? r.tipoSustratoId.nombre : "—";
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Incubación ({recipientes.length})</h2>
        <Button size="sm" onClick={() => setNuevoOpen(true)}>
          <Plus /> Nueva incubación
        </Button>
      </div>

      {recipientes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Este lote todavía no tiene recipientes de incubación.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° de seguimiento</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Sustrato</TableHead>
              <TableHead>Peso (kg)</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Inicio incubación</TableHead>
              <TableHead>Días</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipientes.map((r) => {
              const alerta = alertaRecipiente(r);
              const esTerminal = RECIPIENTE_ESTADOS_TERMINALES.includes(r.estado);
              return (
                <TableRow key={r._id}>
                  <TableCell className="font-medium">{r.numeroSeguimiento}</TableCell>
                  <TableCell className="max-w-48 truncate text-muted-foreground">
                    {getOrigenFrascosLabel(r)}
                  </TableCell>
                  <TableCell>{nombreSustrato(r)}</TableCell>
                  <TableCell>{r.pesoSustratoKg.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={RECIPIENTE_ESTADO_BADGE_VARIANT[r.estado]}>
                      {RECIPIENTE_ESTADO_LABELS[r.estado]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatFechaCorta(r.fechaInicioIncubacion)}</TableCell>
                  <TableCell>
                    {r.estado === "incubando" ? (
                      <span
                        className={
                          alerta.demorado ? "flex items-center gap-1 text-destructive" : ""
                        }
                      >
                        {alerta.demorado && <TriangleAlert className="size-3.5 shrink-0" />}
                        {alerta.diasTranscurridos ?? "—"}
                        {alerta.diasEsperados ? ` / ${alerta.diasEsperados}` : ""}
                      </span>
                    ) : (
                      "—"
                    )}
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
                        {r.estado === "incubando" && (
                          <DropdownMenuItem onClick={() => setFructificarTarget(r)}>
                            Pasar a fructificación
                          </DropdownMenuItem>
                        )}
                        {!esTerminal && (
                          <>
                            <DropdownMenuItem
                              onClick={() => setEstadoTarget({ recipiente: r, estado: "finalizado" })}
                            >
                              Marcar finalizado
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() =>
                                setEstadoTarget({ recipiente: r, estado: "contaminado" })
                              }
                            >
                              Marcar contaminado
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() =>
                                setEstadoTarget({ recipiente: r, estado: "descartado" })
                              }
                            >
                              Marcar descartado
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <NuevoRecipienteSheet
        open={nuevoOpen}
        onOpenChange={setNuevoOpen}
        batchId={batchId}
        fungusType={fungusType}
        onSuccess={onChanged}
      />

      {fructificarTarget && (
        <FructificarSheet
          open={!!fructificarTarget}
          onOpenChange={(open) => {
            if (!open) setFructificarTarget(null);
          }}
          recipiente={fructificarTarget}
          fungusType={fungusType}
          onSuccess={onChanged}
        />
      )}

      {estadoTarget && (
        <RecipienteEstadoDialog
          open={!!estadoTarget}
          onOpenChange={(open) => {
            if (!open) setEstadoTarget(null);
          }}
          recipienteId={estadoTarget.recipiente._id}
          numeroSeguimiento={estadoTarget.recipiente.numeroSeguimiento}
          estadoObjetivo={estadoTarget.estado}
          onSuccess={onChanged}
        />
      )}
    </div>
  );
}
