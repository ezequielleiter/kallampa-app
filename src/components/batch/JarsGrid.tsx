"use client";

import Link from "next/link";
import { toast } from "sonner";
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
import { StateSelect } from "@/components/kallampa/StateSelect";
import { EmptyState } from "@/components/kallampa/PageHeader";
import { JAR_ESTADOS, type JarEstado } from "@/lib/constants";
import { apiFetch } from "@/lib/api-client";
import type { Jar } from "@/lib/types";
import { codigoCorto } from "./lote-view";

interface JarsGridProps {
  jars: Jar[];
  onChanged: () => void;
}

export function JarsGrid({ jars, onChanged }: JarsGridProps) {
  const t = useTranslations("components.jarsGrid");
  const tEstado = useTranslations("estados.jar");

  async function handleEstadoChange(jar: Jar, estado: JarEstado) {
    try {
      await apiFetch(`/api/jars/${jar._id}`, {
        method: "PATCH",
        body: JSON.stringify({ estado }),
      });
      toast.success(
        t("successMessage", {
          codigo: codigoCorto(jar.numeroGuia),
          estado: tEstado(estado).toLowerCase(),
        })
      );
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorMessage"));
    }
  }

  if (jars.length === 0) {
    return <EmptyState>{t("emptyState")}</EmptyState>;
  }

  return (
    <Table minWidth={420}>
      <TableHeader>
        <TableRow>
          <TableHead>{t("numeroGuia")}</TableHead>
          <TableHead>{t("estado")}</TableHead>
          <TableHead className="text-right">
            <span className="sr-only">{t("acciones")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jars.map((jar) => (
          <TableRow key={jar._id}>
            <TableCell>{jar.numeroGuia}</TableCell>
            <TableCell>
              <StateSelect
                label={t("estadoDe", { codigo: jar.numeroGuia })}
                value={jar.estado}
                options={JAR_ESTADOS.map((estado) => ({
                  value: estado,
                  label: tEstado(estado),
                }))}
                onChange={(v) => handleEstadoChange(jar, v as JarEstado)}
              />
            </TableCell>
            <TableCell className="text-right">
              {jar.estado === "colonizado" && (
                <Button
                  variant="ghost"
                  size="sm"
                  render={<Link href={`/clonacion/nueva?origenJarId=${jar._id}`} />}
                >
                  <GitBranchIcon /> {t("clonar")}
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
