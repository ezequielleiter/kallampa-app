"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/kallampa/SectionCard";
import { EmptyState, PageContainer, PageHeader } from "@/components/kallampa/PageHeader";
import { EquipoCard } from "@/components/monitoreo/vista/EquipoCard";
import { InventarioVivo } from "@/components/monitoreo/vista/InventarioVivo";
import { LotesActivos } from "@/components/monitoreo/vista/LotesActivos";
import { useHace } from "@/components/monitoreo/vista/useHace";
import { apiFetch } from "@/lib/api-client";
import type { ResumenMonitoreo } from "@/lib/monitoreo/tipos";
import type { GestionResumen } from "@/lib/types";

const REFRESCO_MS = 60_000;

/** Cada llamada tiene su propio estado: un error en una no borra la otra. Si un refresco falla se conservan los datos anteriores. */
type Carga<T> = { data: T | null; error: string | null };

const visible = () => document.visibilityState === "visible";

export default function MonitoreoPage() {
  const t = useTranslations("pages.monitoreo");
  const hace = useHace();
  const [resumen, setResumen] = useState<Carga<ResumenMonitoreo>>({ data: null, error: null });
  const [gestion, setGestion] = useState<Carga<GestionResumen>>({ data: null, error: null });
  const [actualizado, setActualizado] = useState<number | null>(null);
  const [ahora, setAhora] = useState<number | null>(null);

  const cargar = useCallback(() => {
    const ok = () => {
      const n = Date.now();
      setActualizado(n);
      setAhora(n);
    };
    const mensaje = (err: unknown) => (err instanceof Error ? err.message : t("errorGenerico"));
    apiFetch<ResumenMonitoreo>("/api/monitoreo/resumen").then(
      (data) => {
        setResumen({ data, error: null });
        ok();
      },
      (err) => setResumen((p) => ({ data: p.data, error: mensaje(err) }))
    );
    apiFetch<GestionResumen>("/api/monitoreo/gestion").then(
      (data) => {
        setGestion({ data, error: null });
        ok();
      },
      (err) => setGestion((p) => ({ data: p.data, error: mensaje(err) }))
    );
  }, [t]);

  useEffect(() => {
    void Promise.resolve().then(cargar);
    // Con la pestaña oculta no se pide nada; al volver se refresca enseguida.
    const id = setInterval(() => {
      setAhora(Date.now());
      if (visible()) cargar();
    }, REFRESCO_MS);
    const alVolver = () => visible() && cargar();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [cargar]);

  return (
    <PageContainer className="gap-3.5">
      <PageHeader
        title={t("title")}
        subtitle={
          actualizado != null && ahora != null
            ? t("actualizado", { tiempo: hace(ahora - actualizado) })
            : t("cargando")
        }
      />

      {resumen.data && ahora != null ? (
        <>
          {resumen.error && <p className="m-0 text-[13px] text-danger-text">{resumen.error}</p>}
          {resumen.data.invernaderos.length === 0 ? (
            <SectionCard title={t("equipos")}>
              <EmptyState>
                {t("sinInvernaderos")}{" "}
                <Link href="/invernaderos" className="text-text-accent underline-offset-4 hover:underline">
                  {t("irInvernaderos")}
                </Link>
              </EmptyState>
            </SectionCard>
          ) : (
            resumen.data.invernaderos.map((inv) => (
              <SectionCard
                key={inv._id}
                title={inv.nombre}
                meta={t("equiposCount", { count: inv.equipos.length })}
                actions={
                  <Link
                    href={`/invernaderos/${inv._id}`}
                    className="text-[13px] text-text-accent underline-offset-4 hover:underline"
                  >
                    {t("verInvernadero")}
                  </Link>
                }
              >
                {inv.equipos.length === 0 ? (
                  <p className="m-0 text-[13px] text-text-subtle">{t("sinEquipos")}</p>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-3">
                    {inv.equipos.map((e) => (
                      <EquipoCard key={e.dispositivoId} equipo={e} invernaderoId={inv._id} ahora={ahora} />
                    ))}
                  </div>
                )}
              </SectionCard>
            ))
          )}
        </>
      ) : (
        <SectionCard title={t("equipos")}>
          <EmptyState>{resumen.error ?? t("cargando")}</EmptyState>
        </SectionCard>
      )}

      <div className="grid grid-cols-1 items-start gap-3.5 lg:grid-cols-2">
        <SectionCard title={t("gestion")}>
          {gestion.error && !gestion.data ? (
            <EmptyState>{gestion.error}</EmptyState>
          ) : gestion.data ? (
            <>
              {gestion.error && <p className="mt-0 mb-3 text-[13px] text-danger-text">{gestion.error}</p>}
              <InventarioVivo data={gestion.data} />
            </>
          ) : (
            <EmptyState>{t("cargando")}</EmptyState>
          )}
        </SectionCard>
        <SectionCard
          title={t("lotesActivos")}
          meta={gestion.data && gestion.data.lotesActivos.length > 0 ? gestion.data.lotesActivos.length : undefined}
        >
          {gestion.error && !gestion.data ? (
            <EmptyState>{gestion.error}</EmptyState>
          ) : gestion.data ? (
            <LotesActivos lotes={gestion.data.lotesActivos} />
          ) : (
            <EmptyState>{t("cargando")}</EmptyState>
          )}
        </SectionCard>
      </div>
    </PageContainer>
  );
}
