"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { TreeStructureIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageContainer } from "@/components/kallampa/PageHeader";
import { KpiGrid, type KpiItem } from "@/components/kallampa/Kpi";
import { ProgressDays } from "@/components/kallampa/ProgressDays";
import { SectionCard } from "@/components/kallampa/SectionCard";
import { Stepper, type Step } from "@/components/kallampa/Stepper";
import { useFormat } from "@/components/kallampa/useFormat";
import { useBreadcrumbs } from "@/components/shared/Breadcrumbs";
import { PlacasGrid } from "@/components/clonacion/PlacasGrid";
import { FrascosLiquidosSection } from "@/components/clonacion/FrascosLiquidosSection";
import { apiFetch } from "@/lib/api-client";
import { diasTranscurridos } from "@/lib/recipiente-utils";
import type { ClonacionDetail } from "@/lib/types";

export default function ClonacionDetailPage() {
  const params = useParams<{ id: string }>();
  const t = useTranslations("pages.clonacionDetalle");
  const tList = useTranslations("pages.clonacion");
  const tNav = useTranslations("nav");
  const tOrigen = useTranslations("estados.origenProceso");
  const fmt = useFormat();
  const [clonacion, setClonacion] = useState<ClonacionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useBreadcrumbs([
    { label: tNav("micelio"), href: "/clonacion" },
    { label: tList("title"), href: "/clonacion" },
    ...(clonacion ? [{ label: clonacion.numeroLote }] : []),
  ]);

  const cargar = useCallback(async () => {
    try {
      const data = await apiFetch<ClonacionDetail>(`/api/clonaciones/${params.id}`);
      setClonacion(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [params.id, t]);

  useEffect(() => {
    void Promise.resolve().then(() => cargar());
  }, [cargar]);

  if (loading) {
    return (
      <PageContainer>
        <EmptyState>{t("loading")}</EmptyState>
      </PageContainer>
    );
  }

  if (!clonacion) {
    return (
      <PageContainer>
        <EmptyState>{t("notFound")}</EmptyState>
      </PageContainer>
    );
  }

  const esPlaca = clonacion.origenProceso === "placa";
  const { placas, frascosLiquidos, colonizacion } = clonacion;

  const diasColonizacion = diasTranscurridos(colonizacion?.fechaInicio);
  const diasEsperados = colonizacion?.diasEsperados ?? 0;
  const placasColonizando = placas.filter((p) => p.estado === "colonizando").length;
  const placasColonizadas = placas.filter((p) => p.estado === "colonizado").length;
  const placasContaminadas = placas.filter((p) => p.estado === "contaminado").length;
  const placasDemoradas =
    esPlaca && diasColonizacion !== null && diasColonizacion > diasEsperados
      ? placasColonizando
      : 0;
  const frascosColonizados = frascosLiquidos.filter((f) => f.estado === "colonizado").length;

  const origenBatch =
    typeof clonacion.origenBatchId === "object" ? clonacion.origenBatchId : null;
  const origenEtiqueta =
    clonacion.origenTipo === "jar" && typeof clonacion.origenJarId === "object"
      ? clonacion.origenJarId.numeroGuia
      : clonacion.origenTipo === "recipiente" && typeof clonacion.origenRecipienteId === "object"
        ? clonacion.origenRecipienteId.numeroSeguimiento
        : null;

  // Etapas: solo las clonaciones por placas tienen colonizacion; las demas
  // arrancan directamente con el micelio liquido.
  const steps: Step[] = [
    {
      name: t("stepInicio"),
      meta: `${fmt.fecha(clonacion.fechaInicio)} · ${tOrigen(clonacion.origenProceso)}`,
      state: "done",
    },
    ...(esPlaca
      ? [
          {
            name: t("stepColonizacion"),
            meta: t("stepColonizacionMeta", {
              colonizadas: placasColonizadas,
              total: placas.length,
            }),
            state: placasColonizando > 0 ? ("active" as const) : ("done" as const),
          },
        ]
      : []),
    {
      name: t("stepMicelio"),
      meta: t("stepMicelioMeta", { count: frascosLiquidos.length, colonizados: frascosColonizados }),
      state:
        frascosLiquidos.length === 0
          ? "pending"
          : frascosLiquidos.some((f) => f.estado === "colonizando" || f.estado === "colonizado")
            ? "active"
            : "done",
    },
  ];

  const kpis: KpiItem[] = esPlaca
    ? [
        {
          label: t("kpiPlacasColonizadas"),
          value: `${placasColonizadas} / ${placas.length}`,
        },
        { label: t("kpiPlacasContaminadas"), value: placasContaminadas },
        {
          label: t("kpiDiasColonizacion"),
          value:
            diasColonizacion === null ? (
              "—"
            ) : (
              <ProgressDays
                value={diasColonizacion}
                total={diasEsperados}
                late={placasDemoradas > 0}
                width={72}
              />
            ),
        },
        { label: t("kpiMicelioColonizado"), value: frascosColonizados },
      ]
    : [
        { label: t("cantidadFrascosLabel"), value: clonacion.cantidadFrascos ?? "—" },
        { label: t("kpiMicelioColonizado"), value: frascosColonizados },
      ];

  return (
    <PageContainer>
      <div className="rounded-lg bg-surface-card px-5 py-[18px] shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="m-0 text-[22px] leading-tight font-medium tracking-[-0.015em]">
                {clonacion.numeroLote}
              </h1>
              {placasDemoradas > 0 && (
                <Badge variant="destructive">
                  <WarningCircleIcon /> {t("delayedPlacas", { count: placasDemoradas })}
                </Badge>
              )}
            </div>
            <div className="mt-1.5 text-[13px] text-text-muted">
              {clonacion.fungusTypeId?.nombre}
              {clonacion.fungusTypeId?.nombreCientifico && (
                <>
                  {" · "}
                  <i>{clonacion.fungusTypeId.nombreCientifico}</i>
                </>
              )}
              {" · "}
              {t("startedOn")} {fmt.fecha(clonacion.fechaInicio)}
              {origenBatch && (
                <>
                  {" · "}
                  {t("startedFromBatch")}{" "}
                  <Link
                    href={`/lotes/${origenBatch._id}`}
                    className="text-accent-300 hover:text-accent-100"
                  >
                    {origenBatch.numeroLote}
                  </Link>
                  {origenEtiqueta ? ` (${origenEtiqueta})` : ""}
                </>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" render={<Link href="/trazabilidad" />}>
            <TreeStructureIcon /> {t("viewTraceability")}
          </Button>
        </div>

        <div className="mt-5">
          <Stepper steps={steps} />
        </div>

        <KpiGrid items={kpis} className="mt-[18px] border-t border-divider pt-4" />
      </div>

      {esPlaca && (
        <SectionCard
          number="01"
          title={t("colonizacionTitle")}
          meta={t("colonizacionMeta", {
            count: colonizacion?.cantidadPlacas ?? placas.length,
            fecha: fmt.fecha(colonizacion?.fechaInicio),
            dias: diasEsperados,
          })}
        >
          <div className="flex flex-col gap-3">
            {clonacion.recetaAgar && (
              <div className="rounded-md bg-surface-inset px-3.5 py-3">
                <div className="text-xs text-text-subtle">{t("recetaAgar")}</div>
                <p className="m-0 mt-1 text-[13px] whitespace-pre-wrap">{clonacion.recetaAgar}</p>
              </div>
            )}
            <PlacasGrid placas={placas} onChanged={cargar} />
          </div>
        </SectionCard>
      )}

      <FrascosLiquidosSection
        number={esPlaca ? "02" : "01"}
        frascosLiquidos={frascosLiquidos}
        placas={placas}
        onChanged={cargar}
        permiteAgregar={esPlaca}
      />
    </PageContainer>
  );
}
