"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeftIcon, WifiHighIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/kallampa/Logo";
import { MonitoreoPanel } from "@/components/monitoreo/MonitoreoPanel";
import { EquipoCard } from "@/components/monitoreo/vista/EquipoCard";
import { useResumenEnVivo } from "@/components/monitoreo/vista/useResumenEnVivo";
import { FiguraInvernadero } from "@/components/figuras/fructificacion/figure";
import { estadoFigura } from "@/components/figuras/fructificacion/model";
import type { ArteFigura } from "@/components/figuras/tipos";
import type { ModeloInvernadero } from "@/lib/invernadero-modelos";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Invernadero } from "@/lib/types";

/** Monitoreo de un invernadero: figura en vivo (si su modelo tiene), tarjeta del equipo y graficas. */
export function MonitoreoInvernadero({ arte }: { arte: Partial<Record<ModeloInvernadero, ArteFigura>> }) {
  const t = useTranslations("pages.monitoreo");
  const { id } = useParams<{ id: string }>();
  const inicial = useSearchParams().get("dispositivo") ?? undefined;
  const [carga, setCarga] = useState<{ data: Invernadero | null; error?: string; cargando: boolean }>({ data: null, cargando: true });
  const [elegido, setElegido] = useState<string | undefined>(inicial);
  const { resumen, ahora, permiso, activo, conectar, vivo, enVivo } = useResumenEnVivo();

  useEffect(() => {
    let vigente = true;
    void Promise.resolve().then(() =>
      apiFetch<Invernadero>(`/api/invernaderos/${id}`).then(
        (data) => vigente && setCarga({ data, cargando: false }),
        (err) => vigente && setCarga({ data: null, error: err instanceof Error ? err.message : undefined, cargando: false })
      )
    );
    return () => {
      vigente = false;
    };
  }, [id]);

  const inv = carga.data;
  const conInflux = inv?.dispositivos?.some((d) => d.influxId) ?? false;
  const equipos = resumen?.invernaderos.find((i) => i._id === id)?.equipos ?? [];
  const equipo = equipos.find((e) => e.dispositivoId === elegido) ?? null;
  const arteFigura = inv?.modelo ? arte[inv.modelo] : undefined;

  return (
    <div className="flex min-h-dvh flex-col gap-3 p-4">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <Logo size={24} wordmark={false} />
          <h1 className="m-0 text-sm font-medium tracking-[0.12em] uppercase">{t("detalle.titulo")}</h1>
          {inv && <span className="truncate text-sm text-text-subtle">{inv.nombre}</span>}
        </div>
        {!activo && permiso === "prompt" && equipos.length > 0 && (
          <Button size="sm" onClick={conectar}>
            <WifiHighIcon aria-hidden="true" />
            {t("vivo.conectar")}
          </Button>
        )}
        {permiso === "denied" && <p className="m-0 max-w-md text-xs text-danger-text">{t("vivo.denegado")}</p>}
        <Button variant="outline" size="sm" className="ml-auto" render={<Link href="/monitoreo" />}>
          <ArrowLeftIcon aria-hidden="true" />
          {t("detalle.volver")}
        </Button>
      </header>

      <main className="flex min-w-0 flex-col gap-3">
        {carga.cargando ? (
          <Aviso>{t("cargando")}</Aviso>
        ) : !inv ? (
          <Aviso>{carga.error ?? t("detalle.noEncontrado")}</Aviso>
        ) : !conInflux ? (
          <Aviso>
            {t("detalle.sinInflux")}{" "}
            <Link href={`/invernaderos/${inv._id}`} className="text-text-accent underline-offset-4 hover:underline">
              {t("verInvernadero")}
            </Link>
          </Aviso>
        ) : (
          <>
            {(arteFigura || equipo) && (
              <div className={cn("grid items-start gap-3", arteFigura && "md:grid-cols-[2fr_1fr]")}>
                {arteFigura && (
                  <FiguraInvernadero modelo={inv.modelo} arte={arteFigura} estado={estadoFigura(equipo, equipo ? enVivo(equipo.dispositivoId) : false)} nombre={inv.nombre} />
                )}
                {equipo && (
                  <EquipoCard
                    equipo={equipo}
                    invernadero={inv}
                    ahora={ahora ?? 0}
                    vivo={activo ? (vivo[equipo.dispositivoId] ?? null) : null}
                    enlace={false}
                  />
                )}
              </div>
            )}
            <MonitoreoPanel invernadero={inv} number="01" dispositivoInicial={inicial} onDispositivoChange={setElegido} />
          </>
        )}
      </main>
    </div>
  );
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-40 place-items-center rounded-lg border border-divider bg-surface-card p-6 text-center text-[13px] text-text-subtle">
      <p className="m-0">{children}</p>
    </div>
  );
}
