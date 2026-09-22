"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
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
import { RECIPIENTE_ESTADO_BADGE_VARIANT } from "@/lib/constants";
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
  const t = useTranslations("components.fructificacionSection");
  const tEstado = useTranslations("estados.recipiente");
  const [target, setTarget] = useState<Recipiente | null>(null);

  if (recipientes.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("emptyState")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("numeroSeguimiento")}</TableHead>
            <TableHead>{t("estado")}</TableHead>
            <TableHead>{t("inicioFructificacion")}</TableHead>
            <TableHead>{t("dias")}</TableHead>
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
                    {tEstado(r.estado)}
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
                        {t("pasarAFructificacion")}
                      </Button>
                    )}
                    {r.estado === "fructificando" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        render={<Link href={`/clonacion/nueva?origenRecipienteId=${r._id}`} />}
                      >
                        <Dna /> {t("clonar")}
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
