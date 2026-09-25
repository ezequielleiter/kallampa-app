"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  PlusIcon,
  DotsThreeIcon,
  ArrowRightIcon,
  CheckIcon,
  WarningCircleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SectionCard } from "@/components/kallampa/SectionCard";
import { StatusTag } from "@/components/kallampa/StatusTag";
import { ProgressDays } from "@/components/kallampa/ProgressDays";
import { EmptyState } from "@/components/kallampa/PageHeader";
import { useFormat } from "@/components/kallampa/useFormat";
import { RECIPIENTE_ESTADOS_TERMINALES } from "@/lib/constants";
import { alertaRecipiente, getOrigenFrascosLabel } from "@/lib/recipiente-utils";
import type { FungusType, Jar, Recipiente } from "@/lib/types";
import { NuevoRecipienteSheet } from "./NuevoRecipienteSheet";
import { FructificarSheet } from "./FructificarSheet";
import { RecipienteEstadoDialog } from "./RecipienteEstadoDialog";
import { diasIncubacion, nombreSustrato } from "./lote-view";

interface RecipientesTableProps {
  batchId: string;
  fungusType: FungusType;
  jars: Jar[];
  recipientes: Recipiente[];
  onChanged: () => void;
}

type EstadoObjetivo = "finalizado" | "contaminado" | "descartado";

/** Seccion "02 Incubacion": recipientes del lote y sus acciones. */
export function RecipientesTable({
  batchId,
  fungusType,
  jars,
  recipientes,
  onChanged,
}: RecipientesTableProps) {
  const t = useTranslations("components.recipientesTable");
  const fmt = useFormat();
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [fructificarTarget, setFructificarTarget] = useState<Recipiente | null>(null);
  const [estadoTarget, setEstadoTarget] = useState<{
    recipiente: Recipiente;
    estado: EstadoObjetivo;
  } | null>(null);

  return (
    <SectionCard
      number="02"
      title={t("title")}
      meta={t("meta", { count: recipientes.length })}
      actions={
        <Button onClick={() => setNuevoOpen(true)}>
          <PlusIcon /> {t("nuevaIncubacion")}
        </Button>
      }
    >
      {recipientes.length === 0 ? (
        <EmptyState>{t("emptyState")}</EmptyState>
      ) : (
        <Table minWidth={720}>
          <TableHeader>
            <TableRow>
              <TableHead>{t("numeroSeguimiento")}</TableHead>
              <TableHead>{t("origen")}</TableHead>
              <TableHead>{t("sustrato")}</TableHead>
              <TableHead className="text-right">{t("peso")}</TableHead>
              <TableHead>{t("estado")}</TableHead>
              <TableHead>{t("dias")}</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">{t("acciones")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipientes.map((r) => {
              const esTerminal = RECIPIENTE_ESTADOS_TERMINALES.includes(r.estado);
              const dias = diasIncubacion(r);
              const demorado = r.estado === "incubando" && alertaRecipiente(r).demorado;
              return (
                <TableRow key={r._id}>
                  <TableCell>{r.numeroSeguimiento}</TableCell>
                  <TableCell className="max-w-48 truncate text-text-muted">
                    {getOrigenFrascosLabel(r)}
                  </TableCell>
                  <TableCell>{nombreSustrato(r)}</TableCell>
                  <TableCell className="text-right">{fmt.kg(r.pesoSustratoKg)}</TableCell>
                  <TableCell>
                    <StatusTag kind="recipiente" estado={r.estado} />
                  </TableCell>
                  <TableCell>
                    {dias !== null ? (
                      <ProgressDays
                        value={dias}
                        total={r.diasEsperadosIncubacion}
                        estado={r.estado === "incubando" ? "incubando" : "finalizado"}
                        late={demorado}
                      />
                    ) : (
                      <span className="text-text-subtle">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!esTerminal && (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={t("accionesDe", { codigo: r.numeroSeguimiento })}
                              className="text-text-muted hover:text-foreground"
                            >
                              <DotsThreeIcon weight="bold" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="min-w-52">
                          {r.estado === "incubando" && (
                            <DropdownMenuItem onClick={() => setFructificarTarget(r)}>
                              <ArrowRightIcon /> {t("pasarAFructificacion")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => setEstadoTarget({ recipiente: r, estado: "finalizado" })}
                          >
                            <CheckIcon /> {t("marcarFinalizado")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setEstadoTarget({ recipiente: r, estado: "contaminado" })}
                          >
                            <WarningCircleIcon /> {t("marcarContaminado")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setEstadoTarget({ recipiente: r, estado: "descartado" })}
                          >
                            <TrashIcon /> {t("marcarDescartado")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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
        jars={jars}
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
    </SectionCard>
  );
}
