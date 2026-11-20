"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeftIcon, CornersInIcon, CornersOutIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/kallampa/Logo";
import { AlertasPanel } from "@/components/monitoreo/vista/AlertasPanel";
import { EquipoCard } from "@/components/monitoreo/vista/EquipoCard";
import { InventarioVivo } from "@/components/monitoreo/vista/InventarioVivo";
import { LotesActivos } from "@/components/monitoreo/vista/LotesActivos";
import { useHace } from "@/components/monitoreo/vista/useHace";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { ResumenMonitoreo } from "@/lib/monitoreo/tipos";
import type { GestionResumen } from "@/lib/types";

const REFRESCO_MS = 60_000;

/** Cada llamada tiene su propio estado: un error en una no borra la otra. Si un refresco falla se conservan los datos anteriores. */
type Carga<T> = { data: T | null; error: string | null; at?: number };

const visible = () => document.visibilityState === "visible";

/**
 * Sala de control: todo en una pantalla (sin scroll en compu). Equipos de
 * todos los invernaderos lado a lado a la izquierda; alertas, inventario y
 * lotes a la derecha. En celular se apila y se scrollea.
 */
export default function MonitoreoPage() {
  const t = useTranslations("pages.monitoreo");
  const hace = useHace();
  const [resumen, setResumen] = useState<Carga<ResumenMonitoreo>>({ data: null, error: null });
  const [gestion, setGestion] = useState<Carga<GestionResumen>>({ data: null, error: null });
  const [ahora, setAhora] = useState<number | null>(null);
  const [fullscreenOk, setFullscreenOk] = useState(false);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);

  useEffect(() => {
    const sync = () => setPantallaCompleta(document.fullscreenElement != null);
    void Promise.resolve().then(() => {
      setFullscreenOk(document.fullscreenEnabled);
      sync();
    });
    document.addEventListener("fullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  const alternarPantallaCompleta = () => {
    // Puede rechazarse (p. ej. permisos del navegador): no hay nada que hacer.
    const p = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    p.catch(() => {});
  };

  const cargar = useCallback(() => {
    const mensaje = (err: unknown) => (err instanceof Error ? err.message : t("errorGenerico"));
    apiFetch<ResumenMonitoreo>("/api/monitoreo/resumen").then(
      (data) => {
        const at = Date.now();
        setResumen({ data, error: null, at });
        setAhora(at);
      },
      (err) => setResumen((p) => ({ ...p, error: mensaje(err) }))
    );
    apiFetch<GestionResumen>("/api/monitoreo/gestion").then(
      (data) => {
        const at = Date.now();
        setGestion({ data, error: null, at });
        setAhora(at);
      },
      (err) => setGestion((p) => ({ ...p, error: mensaje(err) }))
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

  // El encabezado sigue a los equipos; gestion solo si el resumen nunca cargo.
  const actualizado = resumen.at ?? gestion.at ?? null;
  const equipos = (resumen.data?.invernaderos ?? []).flatMap((inv) =>
    inv.equipos.map((e) => ({ equipo: e, invernadero: { _id: inv._id, nombre: inv.nombre } }))
  );
  const conInflux = equipos.filter((x) => x.equipo.conexion !== "sin_influx");
  const enLinea = conInflux.filter((x) => x.equipo.conexion === "conectado").length;

  return (
    <div className="flex min-h-dvh flex-col gap-3 p-4 lg:h-dvh lg:overflow-hidden">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-2.5">
          <Logo size={24} wordmark={false} />
          <h1 className="m-0 text-sm font-medium tracking-[0.12em] uppercase">{t("sala.titulo")}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs tabular-nums">
          {resumen.data && conInflux.length > 0 && (
            <span className="text-text-subtle">
              {t("sala.enLinea")}{" "}
              <span className={cn("font-tele text-sm", enLinea < conInflux.length ? "text-danger-text" : "text-text-strong")}>
                {enLinea}/{conInflux.length}
              </span>
            </span>
          )}
          <span className="text-text-subtle">
            {actualizado != null && ahora != null ? t("sala.actualizado", { tiempo: hace(ahora - actualizado) }) : t("cargando")}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Reloj />
          {fullscreenOk && (
            <Button variant="outline" size="sm" onClick={alternarPantallaCompleta}>
              {pantallaCompleta ? <CornersInIcon aria-hidden="true" /> : <CornersOutIcon aria-hidden="true" />}
              <span className="max-sm:sr-only">{pantallaCompleta ? t("salirPantallaCompleta") : t("pantallaCompleta")}</span>
            </Button>
          )}
          <Button variant="outline" size="sm" render={<Link href="/lotes" />}>
            <ArrowLeftIcon aria-hidden="true" />
            <span className="max-sm:sr-only">{t("volverPanel")}</span>
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(300px,24rem)]">
        <main className="min-h-0 lg:overflow-auto">
          {resumen.error && <p className="mt-0 mb-2 text-[13px] text-danger-text">{resumen.error}</p>}
          {!resumen.data ? (
            !resumen.error && <Aviso>{t("cargando")}</Aviso>
          ) : resumen.data.invernaderos.length === 0 ? (
            <Aviso>
              {t("sinInvernaderos")}{" "}
              <Link href="/invernaderos" className="text-text-accent underline-offset-4 hover:underline">
                {t("irInvernaderos")}
              </Link>
            </Aviso>
          ) : equipos.length === 0 ? (
            <Aviso>{t("sinEquipos")}</Aviso>
          ) : (
            <div className="grid h-full auto-rows-fr grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] gap-3">
              {equipos.map(({ equipo, invernadero }) => (
                <EquipoCard key={equipo.dispositivoId} equipo={equipo} invernadero={invernadero} ahora={ahora ?? 0} />
              ))}
            </div>
          )}
        </main>

        <aside className="flex min-h-0 flex-col gap-3">
          <AlertasPanel resumen={resumen.data} gestion={gestion.data} ahora={ahora ?? 0} />

          <Panel titulo={t("gestion")}>
            {gestion.data ? (
              <div className="p-4">
                <InventarioVivo data={gestion.data} />
              </div>
            ) : (
              <p className="m-0 px-4 py-3 text-[13px] text-text-subtle">{gestion.error ?? t("cargando")}</p>
            )}
          </Panel>

          <Panel titulo={t("sala.lotes")} contador={gestion.data?.lotesActivos.length} llenar>
            {gestion.data ? (
              <LotesActivos lotes={gestion.data.lotesActivos} />
            ) : (
              <p className="m-0 px-4 py-3 text-[13px] text-text-subtle">{gestion.error ?? t("cargando")}</p>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function Panel({
  titulo,
  contador,
  llenar,
  children,
}: {
  titulo: string;
  contador?: number;
  llenar?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("flex min-h-0 flex-col rounded-lg border border-divider bg-surface-card", llenar && "flex-1")}>
      <h2 className="m-0 flex items-center justify-between border-b border-divider px-4 py-2.5 text-xs font-medium tracking-[0.08em] uppercase">
        <span>{titulo}</span>
        {contador != null && <span className="font-tele text-text-subtle tabular-nums">{contador}</span>}
      </h2>
      {children}
    </section>
  );
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-full min-h-40 place-items-center rounded-lg border border-divider bg-surface-card p-6 text-center text-[13px] text-text-subtle">
      <p className="m-0">{children}</p>
    </div>
  );
}

/** Hora local (HH:MM:SS) y fecha, con tick propio para no re-renderizar la pagina cada segundo. */
function Reloj() {
  const locale = useLocale();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    void Promise.resolve().then(() => setNow(new Date()));
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!now) return null;
  return (
    <div className="flex items-baseline gap-2 tabular-nums max-sm:hidden">
      <span className="text-xs text-text-subtle">
        {now.toLocaleDateString(locale, { weekday: "short", day: "2-digit", month: "2-digit" })}
      </span>
      <time dateTime={now.toISOString()} className="font-tele text-lg text-text-strong">
        {now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
      </time>
    </div>
  );
}
