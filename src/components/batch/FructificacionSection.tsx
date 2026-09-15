"use client";

import { useState } from "react";
import Link from "next/link";
import { TriangleAlert, Dna } from "lucide-react";
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
import { formatFechaCorta } from "@/lib/format";
import { RECIPIENTE_ESTADO_BADGE_VARIANT, RECIPIENTE_ESTADO_LABELS } from "@/lib/constants";
import { alertaRecipiente } from "@/lib/recipiente-utils";
import type { FungusType, Recipiente } from "@/lib/types";
import { FructificarSheet } from "./FructificarSheet";

interface FructificacionSectionProps {
  fungusType: FungusType;
  recipientes: Recipiente[];
  onChanged: () => void;
}

export function FructificacionSection({
  fungusType,
  recipientes,
  onChanged,
}: FructificacionSectionProps) {
  const [target, setTarget] = useState<Recipiente | null>(null);

  if (recipientes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay recipientes en incubación para pasar a fructificación.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>N° de seguimiento</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Inicio fructificación</TableHead>
            <TableHead>Días</TableHead>
            <TableHead className="w-48" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {recipientes.map((r) => {
            const alerta = alertaRecipiente(r);
            return (
              <TableRow key={r._id}>
                <TableCell className="font-medium">{r.numeroSeguimiento}</TableCell>
                <TableCell>
                  <Badge variant={RECIPIENTE_ESTADO_BADGE_VARIANT[r.estado]}>
                    {RECIPIENTE_ESTADO_LABELS[r.estado]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {r.fechaInicioFructificacion ? formatFechaCorta(r.fechaInicioFructificacion) : "—"}
                </TableCell>
                <TableCell>
                  {r.estado === "fructificando" ? (
                    <span
                      className={alerta.demorado ? "flex items-center gap-1 text-destructive" : ""}
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
                  <div className="flex items-center gap-2">
                    {r.estado === "incubando" && (
                      <Button size="sm" onClick={() => setTarget(r)}>
                        Pasar a fructificación
                      </Button>
                    )}
                    {r.estado === "fructificando" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        render={<Link href={`/clonacion/nueva?origenRecipienteId=${r._id}`} />}
                      >
                        <Dna /> Clonar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {target && (
        <FructificarSheet
          open={!!target}
          onOpenChange={(open) => {
            if (!open) setTarget(null);
          }}
          recipiente={target}
          fungusType={fungusType}
          onSuccess={onChanged}
        />
      )}
    </div>
  );
}
