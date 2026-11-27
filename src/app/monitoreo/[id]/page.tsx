"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/kallampa/Logo";
import { MonitoreoPanel } from "@/components/monitoreo/MonitoreoPanel";
import { apiFetch } from "@/lib/api-client";
import type { Invernadero } from "@/lib/types";

/** Monitoreo detallado de un invernadero, abierto desde la vista en vivo (`?dispositivo=` elige el equipo). */
export default function MonitoreoInvernaderoPage() {
  return (
    <Suspense>
      <Contenido />
    </Suspense>
  );
}

function Contenido() {
  const t = useTranslations("pages.monitoreo");
  const { id } = useParams<{ id: string }>();
  const dispositivo = useSearchParams().get("dispositivo") ?? undefined;
  const [estado, setEstado] = useState<{ data: Invernadero | null; cargando: boolean }>({ data: null, cargando: true });

  useEffect(() => {
    let vivo = true;
    void Promise.resolve().then(() =>
      apiFetch<Invernadero>(`/api/invernaderos/${id}`).then(
        (data) => vivo && setEstado({ data, cargando: false }),
        () => vivo && setEstado({ data: null, cargando: false })
      )
    );
    return () => {
      vivo = false;
    };
  }, [id]);

  const inv = estado.data;
  const conInflux = inv?.dispositivos?.some((d) => d.influxId) ?? false;

  return (
    <div className="flex min-h-dvh flex-col gap-3 p-4">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <Logo size={24} wordmark={false} />
          <h1 className="m-0 text-sm font-medium tracking-[0.12em] uppercase">{t("detalle.titulo")}</h1>
          {inv && <span className="truncate text-sm text-text-subtle">{inv.nombre}</span>}
        </div>
        <Button variant="outline" size="sm" className="ml-auto" render={<Link href="/monitoreo" />}>
          <ArrowLeftIcon aria-hidden="true" />
          {t("detalle.volver")}
        </Button>
      </header>

      <main className="min-w-0">
        {estado.cargando ? (
          <Aviso>{t("cargando")}</Aviso>
        ) : !inv ? (
          <Aviso>{t("detalle.noEncontrado")}</Aviso>
        ) : !conInflux ? (
          <Aviso>
            {t("detalle.sinInflux")}{" "}
            <Link href={`/invernaderos/${inv._id}`} className="text-text-accent underline-offset-4 hover:underline">
              {t("verInvernadero")}
            </Link>
          </Aviso>
        ) : (
          <MonitoreoPanel invernadero={inv} number="01" dispositivoInicial={dispositivo} />
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
