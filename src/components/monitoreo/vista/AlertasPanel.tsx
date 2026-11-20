"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useFormat } from "@/components/kallampa/useFormat";
import type { ResumenMonitoreo } from "@/lib/monitoreo/tipos";
import type { GestionResumen } from "@/lib/types";
import { useRango } from "./EquipoCard";
import { useHace } from "./useHace";

type Alerta = { key: string; texto: string; href?: string };

/** Todo lo que pide atencion en una sola lista: equipos (clima, conexion, alarmas) y lotes demorados. */
export function AlertasPanel({
  resumen,
  gestion,
  ahora,
}: {
  resumen: ResumenMonitoreo | null;
  gestion: GestionResumen | null;
  ahora: number;
}) {
  const t = useTranslations("pages.monitoreo");
  const fmt = useFormat();
  const hace = useHace();
  const rango = useRango();

  const alertas: Alerta[] = [];
  for (const inv of resumen?.invernaderos ?? []) {
    for (const e of inv.equipos) {
      const k = e.dispositivoId;
      if (e.conexion === "desconectado" && e.ultimoEstado != null) {
        alertas.push({ key: `${k}-off`, texto: t("sala.alertaDesconectado", { equipo: e.nombre, tiempo: hace(ahora - e.ultimoEstado) }) });
      }
      if (e.fueraTemp && e.ahora.temperatura != null) {
        alertas.push({
          key: `${k}-t`,
          texto: t("sala.alertaFuera", {
            equipo: e.nombre,
            magnitud: t("temperatura").toLowerCase(),
            dir: t(e.fueraTemp).toLowerCase(),
            valor: `${fmt.number(e.ahora.temperatura, 1)} °C`,
            rango: rango(e.rangoTemp, "°C"),
          }),
        });
      }
      if (e.fueraHum && e.ahora.humedad != null) {
        alertas.push({
          key: `${k}-h`,
          texto: t("sala.alertaFuera", {
            equipo: e.nombre,
            magnitud: t("humedad").toLowerCase(),
            dir: t(e.fueraHum).toLowerCase(),
            valor: `${fmt.number(e.ahora.humedad, 1)} %`,
            rango: rango(e.rangoHum, "%"),
          }),
        });
      }
      for (const a of e.alarmas) {
        alertas.push({ key: `${k}-${a}`, texto: `${e.nombre}: ${t(`alarmas.${a}`, { rssi: e.dia.rssi ?? "" })}` });
      }
    }
  }
  for (const l of gestion?.lotesActivos ?? []) {
    if (l.alertas > 0) {
      alertas.push({ key: `lote-${l._id}`, texto: t("sala.alertaLote", { lote: l.numeroLote, count: l.alertas }), href: `/lotes/${l._id}` });
    }
  }

  return (
    <section aria-labelledby="alertas-titulo" className="flex min-h-0 flex-col rounded-lg border border-divider bg-surface-card">
      <h2 id="alertas-titulo" className="m-0 flex items-center justify-between border-b border-divider px-4 py-2.5 text-xs font-medium tracking-[0.08em] uppercase">
        <span>{t("sala.alertas")}</span>
        <span className={alertas.length ? "font-tele text-danger-text tabular-nums" : "font-tele text-text-subtle tabular-nums"}>
          {alertas.length}
        </span>
      </h2>
      {alertas.length === 0 ? (
        <p className="m-0 flex items-center gap-2 px-4 py-3 text-[13px] text-text-body">
          <CheckCircleIcon aria-hidden="true" className="size-4 shrink-0 text-accent-300" />
          {t("sala.sinAlertas")}
        </p>
      ) : (
        <ul className="m-0 flex min-h-0 list-none flex-col gap-2 overflow-auto px-4 py-3 text-[13px] text-danger-text">
          {alertas.map((a) => (
            <li key={a.key} className="flex items-start gap-2">
              <WarningCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {a.href ? (
                <Link href={a.href} className="underline-offset-4 hover:underline">
                  {a.texto}
                </Link>
              ) : (
                <span>{a.texto}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
