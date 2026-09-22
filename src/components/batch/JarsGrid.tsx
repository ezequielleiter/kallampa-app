"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Dna } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { JAR_ESTADOS, type JarEstado } from "@/lib/constants";
import { apiFetch } from "@/lib/api-client";
import type { Jar } from "@/lib/types";

interface JarsGridProps {
  jars: Jar[];
  onChanged: () => void;
}

export function JarsGrid({ jars, onChanged }: JarsGridProps) {
  const t = useTranslations("components.jarsGrid");
  const tEstado = useTranslations("estados.jar");

  async function handleEstadoChange(jarId: string, estado: JarEstado) {
    try {
      await apiFetch(`/api/jars/${jarId}`, {
        method: "PATCH",
        body: JSON.stringify({ estado }),
      });
      toast.success(t("successMessage"));
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorMessage"));
    }
  }

  if (jars.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("emptyState")}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("numeroGuia")}</TableHead>
          <TableHead>{t("estado")}</TableHead>
          <TableHead className="w-32" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {jars.map((jar) => (
          <TableRow key={jar._id}>
            <TableCell className="font-medium">{jar.numeroGuia}</TableCell>
            <TableCell>
              <Select
                items={JAR_ESTADOS.map((estado) => ({
                  label: tEstado(estado),
                  value: estado,
                }))}
                value={jar.estado}
                onValueChange={(v) => handleEstadoChange(jar._id, v as JarEstado)}
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JAR_ESTADOS.map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {tEstado(estado)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              {(jar.estado === "colonizado" || jar.estado === "usado") && (
                <Button variant="ghost" size="sm" render={<Link href={`/clonacion/nueva?origenJarId=${jar._id}`} />}>
                  <Dna /> {t("clonar")}
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
