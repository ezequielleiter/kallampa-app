"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  FlaskIcon,
  PackageIcon,
  PlantIcon,
  PlusIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
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
import { EmptyState, PageContainer, PageHeader } from "@/components/kallampa/PageHeader";
import { SegmentedControl } from "@/components/kallampa/SegmentedControl";
import { useFormat } from "@/components/kallampa/useFormat";
import { useBreadcrumbs } from "@/components/shared/Breadcrumbs";
import { apiFetch } from "@/lib/api-client";
import type { ClonacionListItem, ClonacionResumen } from "@/lib/types";

type OrigenProceso = ClonacionListItem["origenProceso"];
type Filtro = "todas" | OrigenProceso;

const ORIGEN_ICON: Record<OrigenProceso, React.ReactNode> = {
  placa: <FlaskIcon />,
  comprado: <PackageIcon />,
  frascoGrano: <PlantIcon />,
};

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
  return partes.length > 0 ? partes.join(" · ") : "—";
}

function frascosLiquidosResumenLabel(
  resumen: ClonacionResumen,
  t: ReturnType<typeof useTranslations>
): string {
  const partes = [
    resumen.frascosLiquidosColonizando > 0 &&
      t("resumenColonizando", { count: resumen.frascosLiquidosColonizando }),
    resumen.frascosLiquidosColonizados > 0 &&
      t("resumenColonizado", { count: resumen.frascosLiquidosColonizados }),
    resumen.frascosLiquidosVacios > 0 &&
      t("resumenVacio", { count: resumen.frascosLiquidosVacios }),
    resumen.frascosLiquidosFinalizados > 0 &&
      t("resumenFinalizado", { count: resumen.frascosLiquidosFinalizados }),
    resumen.frascosLiquidosContaminados > 0 &&
      t("resumenFrascoContaminado", { count: resumen.frascosLiquidosContaminados }),
  ].filter(Boolean);
  return partes.length > 0 ? partes.join(" · ") : "—";
}

export default function ClonacionPage() {
  const router = useRouter();
  const t = useTranslations("pages.clonacion");
  const tNav = useTranslations("nav");
  const tOrigen = useTranslations("estados.origenProceso");
  const fmt = useFormat();
  const [clonaciones, setClonaciones] = useState<ClonacionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>("todas");

  useBreadcrumbs([
    { label: tNav("micelio"), href: "/clonacion" },
    { label: t("title") },
  ]);

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

  const count = (f: Filtro) =>
    clonaciones.filter((c) => f === "todas" || c.origenProceso === f).length;
  const filas = clonaciones.filter((c) => filtro === "todas" || c.origenProceso === filtro);
  const conAlertas = clonaciones.filter((c) => c.resumen.alertas > 0).length;

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        subtitle={
          loading
            ? undefined
            : t("subtitle", { count: clonaciones.length, alertas: conAlertas })
        }
        actions={
          <>
            <SegmentedControl<Filtro>
              aria-label={t("filterLabel")}
              value={filtro}
              onChange={setFiltro}
              options={(["todas", "placa", "comprado", "frascoGrano"] as Filtro[]).map((f) => ({
                value: f,
                label: f === "todas" ? t("filterTodas") : tOrigen(f),
                count: count(f),
              }))}
            />
            <Button onClick={() => router.push("/clonacion/nueva")}>
              <PlusIcon /> {t("newClonacion")}
            </Button>
          </>
        }
      />

      <div className="rounded-lg bg-surface-card px-4 pt-1.5 pb-2.5 shadow-sm">
        {loading ? (
          <EmptyState>{t("loading")}</EmptyState>
        ) : filas.length === 0 ? (
          <EmptyState>{t("empty")}</EmptyState>
        ) : (
          <Table minWidth={760}>
            <TableHeader>
              <TableRow>
                <TableHead>{t("colNumero")}</TableHead>
                <TableHead>{t("colHongo")}</TableHead>
                <TableHead>{t("colOrigen")}</TableHead>
                <TableHead>{t("colFecha")}</TableHead>
                <TableHead>{t("colPlacas")}</TableHead>
                <TableHead>{t("colFrascosLiquidos")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((clonacion) => (
                <TableRow
                  key={clonacion._id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/clonacion/${clonacion._id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{clonacion.numeroLote}</span>
                      {clonacion.resumen.alertas > 0 && (
                        <Badge variant="destructive">
                          <WarningCircleIcon />
                          {t("alertCount", { count: clonacion.resumen.alertas })}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div>{clonacion.fungusTypeId?.nombre}</div>
                    {clonacion.fungusTypeId?.nombreCientifico && (
                      <div className="text-[11.5px] text-text-subtle italic">
                        {clonacion.fungusTypeId.nombreCientifico}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-[12.5px] [&_svg]:size-4 [&_svg]:text-accent">
                      {ORIGEN_ICON[clonacion.origenProceso]}
                      {tOrigen(clonacion.origenProceso)}
                    </span>
                  </TableCell>
                  <TableCell>{fmt.fecha(clonacion.fechaInicio)}</TableCell>
                  <TableCell className="text-[12.5px] text-text-muted">
                    {clonacion.origenProceso === "placa"
                      ? placasResumenLabel(clonacion.resumen, t)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-[12.5px] text-text-muted">
                    {frascosLiquidosResumenLabel(clonacion.resumen, t)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </PageContainer>
  );
}
