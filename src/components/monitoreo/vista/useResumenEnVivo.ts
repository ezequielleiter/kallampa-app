"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api-client";
import { aplicarVivo } from "@/lib/monitoreo/vivo";
import type { EquipoResumen, ResumenMonitoreo } from "@/lib/monitoreo/tipos";
import { useEnVivo } from "./useEnVivo";

const REFRESCO_MS = 60_000;

const visible = () => document.visibilityState === "visible";

/**
 * Resumen de los equipos (Influx, cada 60 s con la pestana visible) con lo que
 * responde cada equipo en la red local (cada 3 s) pisando lo "ahora" de Influx.
 * Si un refresco falla se conservan los datos anteriores.
 */
export function useResumenEnVivo() {
  const t = useTranslations("pages.monitoreo");
  const [carga, setCarga] = useState<{ data: ResumenMonitoreo | null; error: string | null; at: number | null }>({
    data: null,
    error: null,
    at: null,
  });
  const [ahora, setAhora] = useState<number | null>(null);

  const cargar = useCallback(() => {
    apiFetch<ResumenMonitoreo>("/api/monitoreo/resumen").then(
      (data) => {
        const at = Date.now();
        setCarga({ data, error: null, at });
        setAhora(at);
      },
      (err) => setCarga((p) => ({ ...p, error: err instanceof Error ? err.message : t("errorGenerico") }))
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

  const { permiso, activo, conectar, vivo } = useEnVivo(
    (carga.data?.invernaderos ?? []).flatMap((inv) =>
      inv.equipos.map((e) => ({ dispositivoId: e.dispositivoId, dominio: e.dominio }))
    )
  );
  const mezclar = (e: EquipoResumen) => {
    const s = vivo[e.dispositivoId]?.sensors;
    return s ? aplicarVivo(e, s) : e;
  };
  const resumen: ResumenMonitoreo | null = carga.data && {
    ...carga.data,
    invernaderos: carga.data.invernaderos.map((inv) => ({ ...inv, equipos: inv.equipos.map(mezclar) })),
  };
  const enVivo = (id: string) => vivo[id]?.sensors != null;

  return { resumen, error: carga.error, at: carga.at, ahora, permiso, activo, conectar, vivo, enVivo };
}
