"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { GitBranchIcon } from "@phosphor-icons/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/kallampa/SectionCard";
import { StatusTag } from "@/components/kallampa/StatusTag";
import { ProgressDays } from "@/components/kallampa/ProgressDays";
import { EmptyState } from "@/components/kallampa/PageHeader";
import { useFormat } from "@/components/kallampa/useFormat";
import { alertaRecipiente } from "@/lib/recipiente-utils";
import type { Recipiente } from "@/lib/types";

interface FructificacionSectionProps {
  recipientes: Recipiente[];
}

/**
 * Seccion "03 Fructificacion": recipientes que ya pasaron a fructificar.
 * El pase a fructificacion se hace desde el menu de cada recipiente en
 * "02 Incubacion".
 */
export function FructificacionSection({ recipientes }: FructificacionSectionProps) {
  const t = useTranslations("components.fructificacionSection");
  const fmt = useFormat();
  const enFructificacion = recipientes.filter((r) => !!r.fechaInicioFructificacion);
  const activos = enFructificacion.filter((r) => r.estado === "fructificando").length;

  return (
    <SectionCard number="03" title={t("title")} meta={t("meta", { count: activos })}>
      {enFructificacion.length === 0 ? (
        <EmptyState>{t("emptyState")}</EmptyState>
      ) : (
        <Table minWidth={560}>
          <TableHeader>
            <TableRow>
              <TableHead>{t("numeroSeguimiento")}</TableHead>
              <TableHead>{t("estado")}</TableHead>
              <TableHead>{t("inicioFructificacion")}</TableHead>
              <TableHead>{t("dias")}</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">{t("acciones")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enFructificacion.map((r) => {
              const alerta = alertaRecipiente(r);
              return (
                <TableRow key={r._id}>
                  <TableCell>{r.numeroSeguimiento}</TableCell>
                  <TableCell>
                    <StatusTag kind="recipiente" estado={r.estado} />
                  </TableCell>
                  <TableCell>{fmt.fecha(r.fechaInicioFructificacion)}</TableCell>
                  <TableCell>
                    {r.estado === "fructificando" &&
                    alerta.diasTranscurridos !== null &&
                    alerta.diasEsperados !== null ? (
                      <ProgressDays
                        value={alerta.diasTranscurridos}
                        total={alerta.diasEsperados}
                        estado="fructificando"
                        late={alerta.demorado}
                      />
                    ) : (
                      <span className="text-text-subtle">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.estado === "fructificando" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        render={<Link href={`/clonacion/nueva?origenRecipienteId=${r._id}`} />}
                      >
                        <GitBranchIcon /> {t("clonar")}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </SectionCard>
  );
}
