"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Plus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api-client";
import { formatFechaCorta } from "@/lib/format";
import type { ClonacionListItem, ClonacionResumen } from "@/lib/types";

function placasResumenLabel(
  resumen: ClonacionResumen,
  t: ReturnType<typeof useTranslations>
): string {
  const partes = [
    resumen.placasColonizado > 0 && t("resumenColonizado", { count: resumen.placasColonizado }),
    resumen.placasColonizando > 0 &&
      t("resumenColonizando", { count: resumen.placasColonizando }),
    resumen.placasContaminado > 0 &&
      t("resumenContaminado", { count: resumen.placasContaminado }),
  ].filter(Boolean);
  return partes.length > 0 ? partes.join(", ") : "—";
}

function frascosLiquidosResumenLabel(
  resumen: ClonacionResumen,
  t: ReturnType<typeof useTranslations>
): string {
  const partes = [
    resumen.frascosLiquidosValidos > 0 &&
      t("resumenValido", { count: resumen.frascosLiquidosValidos }),
    resumen.frascosLiquidosVacios > 0 &&
      t("resumenVacio", { count: resumen.frascosLiquidosVacios }),
    resumen.frascosLiquidosFinalizados > 0 &&
      t("resumenFinalizado", { count: resumen.frascosLiquidosFinalizados }),
    resumen.frascosLiquidosContaminados > 0 &&
      t("resumenFrascoContaminado", { count: resumen.frascosLiquidosContaminados }),
  ].filter(Boolean);
  return partes.length > 0 ? partes.join(", ") : "—";
}

export default function ClonacionPage() {
  const router = useRouter();
  const t = useTranslations("pages.clonacion");
  const [clonaciones, setClonaciones] = useState<ClonacionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<ClonacionListItem[]>("/api/clonaciones");
      setClonaciones(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void Promise.resolve().then(() => cargar());
  }, [cargar]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        <Button size="sm" onClick={() => router.push("/clonacion/nueva")}>
          <Plus /> {t("newClonacion")}
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : clonaciones.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("colNumero")}</TableHead>
              <TableHead>{t("colHongo")}</TableHead>
              <TableHead>{t("colFecha")}</TableHead>
              <TableHead>{t("colPlacas")}</TableHead>
              <TableHead>{t("colFrascosLiquidos")}</TableHead>
              <TableHead>{t("colAlertas")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clonaciones.map((clonacion) => (
              <TableRow
                key={clonacion._id}
                className="cursor-pointer"
                onClick={() => router.push(`/clonacion/${clonacion._id}`)}
              >
                <TableCell className="font-medium">{clonacion.numeroLote}</TableCell>
                <TableCell>{clonacion.fungusTypeId?.nombre}</TableCell>
                <TableCell>{formatFechaCorta(clonacion.fechaInicio)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {placasResumenLabel(clonacion.resumen, t)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {frascosLiquidosResumenLabel(clonacion.resumen, t)}
                </TableCell>
                <TableCell>
                  {clonacion.resumen.alertas > 0 && (
                    <Badge variant="destructive">
                      <TriangleAlert /> {t("alertCount", { count: clonacion.resumen.alertas })}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
