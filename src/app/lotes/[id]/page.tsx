"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { BatchHeader } from "@/components/batch/BatchHeader";
import { JarsGrid } from "@/components/batch/JarsGrid";
import { RecipientesTable } from "@/components/batch/RecipientesTable";
import { FructificacionSection } from "@/components/batch/FructificacionSection";
import { CosechaSection } from "@/components/batch/CosechaSection";
import { LotePendientes } from "@/components/batch/LotePendientes";
import { SectionCard } from "@/components/kallampa/SectionCard";
import { CostBreakdown } from "@/components/kallampa/CostBreakdown";
import { EmptyState } from "@/components/kallampa/PageHeader";
import { useFormat } from "@/components/kallampa/useFormat";
import { useBreadcrumbs } from "@/components/shared/Breadcrumbs";
import { apiFetch } from "@/lib/api-client";
import {
  alertasBatch,
  costoProduccionBatch,
  eficienciaBiologicaBatch,
  estadoDerivadoBatch,
  pesoTotalCosechado,
} from "@/lib/recipiente-utils";
import type { BatchDetail } from "@/lib/types";

export default function BatchDetailPage() {
  const params = useParams<{ id: string }>();
  const t = useTranslations("pages.loteDetalle");
  const tLotes = useTranslations("pages.lotes");
  const tNav = useTranslations("nav");
  const fmt = useFormat();
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useBreadcrumbs([
    { label: tNav("produccion"), href: "/" },
    { label: tLotes("title"), href: "/" },
    { label: batch?.numeroLote ?? "…" },
  ]);

  const cargar = useCallback(async () => {
    try {
      const data = await apiFetch<BatchDetail>(`/api/batches/${params.id}`);
      setBatch(data);
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
    return <EmptyState className="py-12">{t("loading")}</EmptyState>;
  }

  if (!batch) {
    return <EmptyState className="py-12">{t("notFound")}</EmptyState>;
  }

  const { jars, recipientes } = batch;
  const estadoDerivado = estadoDerivadoBatch(jars, recipientes);
  const alertas = alertasBatch(recipientes);
  const pesoTotal = pesoTotalCosechado(recipientes);
  const eficienciaBiologica = eficienciaBiologicaBatch(recipientes);
  const costoProduccion = costoProduccionBatch(batch, recipientes);
  const nombreGrano =
    typeof batch.inoculacionGrano.tipoGranoId === "object"
      ? batch.inoculacionGrano.tipoGranoId.nombre
      : "—";

  return (
    <div className="flex w-full max-w-(--content-max) flex-wrap items-start gap-5 px-4 pt-5 pb-12 sm:px-6">
      <div className="flex min-w-0 flex-[999_1_620px] flex-col gap-3.5">
        <BatchHeader
          batch={batch}
          estadoDerivado={estadoDerivado}
          alertas={alertas}
          pesoTotalCosechado={pesoTotal}
          eficienciaBiologica={eficienciaBiologica}
          costoProduccion={costoProduccion}
        />

        <SectionCard
          number="01"
          title={t("inoculacionGranoTitle")}
          meta={t("inoculacionGranoMeta", {
            grano: nombreGrano,
            peso: fmt.kg(batch.inoculacionGrano.pesoGranoKg),
            precio: fmt.money(batch.inoculacionGrano.precioPorKg),
            count: batch.inoculacionGrano.cantidadFrascos,
          })}
        >
          <JarsGrid jars={jars} onChanged={cargar} />
        </SectionCard>

        <RecipientesTable
          batchId={batch._id}
          fungusType={batch.fungusTypeId}
          jars={jars}
          recipientes={recipientes}
          onChanged={cargar}
        />

        <FructificacionSection recipientes={recipientes} />

        <CosechaSection recipientes={recipientes} onChanged={cargar} />
      </div>

      <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-3.5 lg:sticky lg:top-[76px]">
        <LotePendientes jars={jars} recipientes={recipientes} />
        <div className="rounded-lg bg-surface-card p-4 shadow-sm">
          <CostBreakdown
            title={t("costosTitle")}
            format={(n) => fmt.money(n)}
            items={[
              { name: t("costoGrano", { grano: nombreGrano }), value: costoProduccion.costoGrano },
              { name: t("costoSustrato"), value: costoProduccion.costoSustrato },
            ]}
          />
        </div>
      </aside>
    </div>
  );
}
