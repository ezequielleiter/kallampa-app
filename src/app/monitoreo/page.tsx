"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeftIcon, CornersInIcon, CornersOutIcon, WifiHighIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/kallampa/Logo";
import { AlertasPanel } from "@/components/monitoreo/vista/AlertasPanel";
import { EquipoCard } from "@/components/monitoreo/vista/EquipoCard";
import { InventarioVivo } from "@/components/monitoreo/vista/InventarioVivo";
import { LotesActivos } from "@/components/monitoreo/vista/LotesActivos";
import { useEnVivo } from "@/components/monitoreo/vista/useEnVivo";
import { useHace } from "@/components/monitoreo/vista/useHace";
import { aplicarVivo } from "@/lib/monitoreo/vivo";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { EquipoResumen, ResumenMonitoreo } from "@/lib/monitoreo/tipos";
import type { GestionResumen } from "@/lib/types";

const REFRESCO_MS = 60_000;

/** Cada llamada tiene su propio estado: un error en una no borra la otra. Si un refresco falla se conservan los datos anteriores. */
type Carga<T> = { data: T | null; error: string | null; at?: number };

const visible = () => document.visibilityState === "visible";

/**
 * Sala de control: paneles compactos del mismo ancho, uno al lado del otro
 * (equipos, alertas, inventario, lotes). En celular se apilan.
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
  const base = (resumen.data?.invernaderos ?? []).flatMap((inv) =>
    inv.equipos.map((e) => ({ equipo: e, invernadero: { _id: inv._id, nombre: inv.nombre } }))
  );
  const { permiso, activo, conectar, vivo } = useEnVivo(
    base.map(({ equipo }) => ({ dispositivoId: equipo.dispositivoId, dominio: equipo.dominio }))
  );
  // Lo que responde el equipo en vivo pisa lo "ahora" de Influx; si no responde, queda Influx.
  const mezclar = (e: EquipoResumen) => {
    const s = vivo[e.dispositivoId]?.sensors;
    return s ? aplicarVivo(e, s) : e;
  };
  const equipos = base.map((x) => ({ ...x, equipo: mezclar(x.equipo) }));
  const resumenVivo: ResumenMonitoreo | null = resumen.data && {
    ...resumen.data,
    invernaderos: resumen.data.invernaderos.map((inv) => ({ ...inv, equipos: inv.equipos.map(mezclar) })),
  };
  const enVivo = (id: string) => vivo[id]?.sensors != null;
  const conInflux = equipos.filter((x) => x.equipo.conexion !== "sin_influx" || enVivo(x.equipo.dispositivoId));
  const enLinea = conInflux.filter((x) => x.equipo.conexion === "conectado" || enVivo(x.equipo.dispositivoId)).length;

  return (
    <div className="flex min-h-dvh flex-col gap-3 p-4">
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

        {!activo && permiso === "prompt" && equipos.length > 0 && (
          <Button size="sm" onClick={conectar}>
            <WifiHighIcon aria-hidden="true" />
            {t("vivo.conectar")}
          </Button>
        )}
        {permiso === "denied" && <p className="m-0 max-w-md text-xs text-danger-text">{t("vivo.denegado")}</p>}

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

      {resumen.error && <p className="m-0 text-[13px] text-danger-text">{resumen.error}</p>}
      {/* Un solo muro de paneles del mismo ancho: equipos primero, despues alertas, inventario y lotes. */}
      <main className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,22rem),1fr))] items-start gap-3">
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
          equipos.map(({ equipo, invernadero }) => (
            <EquipoCard
              key={equipo.dispositivoId}
              equipo={equipo}
              invernadero={invernadero}
              ahora={ahora ?? 0}
              vivo={activo ? (vivo[equipo.dispositivoId] ?? null) : null}
            />
          ))
        )}

        <AlertasPanel resumen={resumenVivo} gestion={gestion.data} ahora={ahora ?? 0} />

        <Panel titulo={t("gestion")}>
          {gestion.data ? (
            <div className="p-4">
              <InventarioVivo data={gestion.data} />
            </div>
          ) : (
            <p className="m-0 px-4 py-3 text-[13px] text-text-subtle">{gestion.error ?? t("cargando")}</p>
          )}
        </Panel>

        <Panel titulo={t("sala.lotes")} contador={gestion.data?.lotesActivos.length}>
          {gestion.data ? (
            <LotesActivos lotes={gestion.data.lotesActivos} />
          ) : (
            <p className="m-0 px-4 py-3 text-[13px] text-text-subtle">{gestion.error ?? t("cargando")}</p>
          )}
        </Panel>
      </main>
    </div>
  );
}

function Panel({
  titulo,
  contador,
  children,
}: {
  titulo: string;
  contador?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-h-0 flex-col rounded-lg border border-divider bg-surface-card">
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
    <div className="grid min-h-40 place-items-center self-stretch rounded-lg border border-divider bg-surface-card p-6 text-center text-[13px] text-text-subtle">
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
