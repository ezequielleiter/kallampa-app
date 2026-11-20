"use client";

import { useCallback, useEffect, useState } from "react";
import { parseSensors, urlSensors, type SensorsVivo } from "@/lib/monitoreo/vivo";

export type PermisoRed = "granted" | "prompt" | "denied";
/** `sensors` null tras una falla (timeout, red, respuesta rara); `at` = ultima respuesta valida (epoch ms). */
export type Vivo = { sensors: SensorsVivo | null; at: number | null };

// El equipo lee el sensor cada 2,5 s y atiende un pedido por vez: nunca mas de uno en vuelo ni mas seguido.
const PAUSA_MS = 3000;
const TIMEOUT_MS = 3000;

const esperar = (ms: number, signal: AbortSignal) =>
  new Promise<void>((res) => {
    const id = setTimeout(res, ms);
    signal.addEventListener("abort", () => (clearTimeout(id), res()), { once: true });
  });

/**
 * Sondea `GET http://<dominio>/sensors` de cada equipo desde el navegador
 * (Local Network Access de Chrome: la pagina https pide permiso de "red
 * local" una vez). Arranca solo si el permiso ya esta concedido; si no,
 * con `conectar()` desde un clic.
 */
export function useEnVivo(equipos: { dispositivoId: string; dominio: string }[]) {
  const [permiso, setPermiso] = useState<PermisoRed>("prompt");
  const [activo, setActivo] = useState(false);
  const [vivo, setVivo] = useState<Record<string, Vivo>>({});

  useEffect(() => {
    let status: PermissionStatus | null = null;
    const sync = () => {
      if (!status) return;
      setPermiso(status.state);
      if (status.state === "granted") setActivo(true);
    };
    // Nombre desconocido (Safari/Firefox, Chrome viejo) ⇒ queda "prompt". Nunca "local-network-access".
    navigator.permissions
      ?.query({ name: "local-network" as PermissionName })
      .then((s) => {
        status = s;
        sync();
        s.addEventListener("change", sync);
      })
      .catch(() => {});
    return () => status?.removeEventListener("change", sync);
  }, []);

  // Clave estable: el resumen se refresca cada 60 s con objetos nuevos pero los mismos equipos.
  const clave = JSON.stringify(equipos.map((e) => [e.dispositivoId, e.dominio]));

  useEffect(() => {
    if (!activo) return;
    const ctrl = new AbortController();
    const { signal } = ctrl;

    const bucle = async (id: string, url: string) => {
      while (!signal.aborted) {
        if (document.visibilityState !== "visible") {
          await esperar(1000, signal);
          continue;
        }
        let sensors: SensorsVivo | null = null;
        try {
          const r = await fetch(url, {
            mode: "cors",
            cache: "no-store",
            // Exime del bloqueo de contenido mixto (https → http local) y dispara el permiso de red local.
            targetAddressSpace: "local",
            signal: AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]),
          } as RequestInit);
          sensors = r.ok ? parseSensors(await r.json()) : null;
        } catch {
          sensors = null;
        }
        if (signal.aborted) return;
        const at = sensors ? Date.now() : null;
        setVivo((p) => ({ ...p, [id]: { sensors, at: at ?? p[id]?.at ?? null } }));
        if (sensors) setPermiso((p) => (p === "prompt" ? "granted" : p));
        await esperar(PAUSA_MS, signal);
      }
    };

    for (const [id, dominio] of JSON.parse(clave) as [string, string][]) {
      const url = urlSensors(dominio);
      if (url) void bucle(id, url);
    }
    return () => ctrl.abort();
  }, [activo, clave]);

  const conectar = useCallback(() => setActivo(true), []);
  return { permiso, activo, conectar, vivo };
}
