"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionCard } from "@/components/kallampa/SectionCard";
import { SegmentedControl } from "@/components/kallampa/SegmentedControl";
import { EmptyState } from "@/components/kallampa/PageHeader";
import { useFormat } from "@/components/kallampa/useFormat";
import { apiFetch } from "@/lib/api-client";
import type { Dispositivo, Invernadero } from "@/lib/types";
import { RANGOS, type Rango, type SerieResponse, type TipoSerie } from "@/lib/monitoreo/tipos";
import { BarChart, COLOR_APAGADO, COLOR_PRENDIDO, type RefLine } from "./BarChart";
import { CiclosTable } from "./CiclosTable";

const STORAGE_RANGO = "kallampa.monitoreo.rango";

function rangoGuardado(): Rango {
  try {
    const v = window.localStorage.getItem(STORAGE_RANGO);
    if (v && (RANGOS as readonly string[]).includes(v)) return v as Rango;
  } catch {
    // storage bloqueado / modo privado: se usa el default
  }
  return "24h";
}

type Estado =
  | { tipo: "cargando" }
  | { tipo: "error"; mensaje: string }
  | { tipo: "ok"; serie: SerieResponse };

/**
 * Seccion de monitoreo del invernadero: por cada dispositivo vinculado a
 * InfluxDB, grafico de temperatura + calefaccion o humedad + humidificador
 * y tabla de ciclos. Los datos se piden a la API (el token de Influx nunca
 * llega al navegador).
 */
export function MonitoreoPanel({
  invernadero,
  number,
}: {
  invernadero: Invernadero;
  number: string;
}) {
  const t = useTranslations("components.monitoreo");
  const fmt = useFormat();
  const vinculados = (invernadero.dispositivos ?? []).filter((d) => d.influxId);
  const [dispositivoId, setDispositivoId] = useState(vinculados[0]?._id);
  const [tipo, setTipo] = useState<TipoSerie>("calefaccion");
  const [range, setRange] = useState<Rango>("24h");
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });

  useEffect(() => {
    void Promise.resolve().then(() => setRange(rangoGuardado()));
  }, []);

  const dispositivo: Dispositivo | undefined =
    vinculados.find((d) => d._id === dispositivoId) ?? vinculados[0];

  useEffect(() => {
    if (!dispositivo) return;
    let vivo = true;
    void Promise.resolve().then(() => vivo && setEstado({ tipo: "cargando" }));
    apiFetch<SerieResponse>(
      `/api/invernaderos/${invernadero._id}/dispositivos/${dispositivo._id}/serie?tipo=${tipo}&range=${range}`
    )
      .then((serie) => vivo && setEstado({ tipo: "ok", serie }))
      .catch(
        (err) =>
          vivo &&
          setEstado({
            tipo: "error",
            mensaje: err instanceof Error ? err.message : t("errorGenerico"),
          })
      );
    return () => {
      vivo = false;
    };
  }, [invernadero._id, dispositivo, tipo, range, t]);

  if (!dispositivo) return null;

  function elegirRango(r: Rango) {
    setRange(r);
    try {
      window.localStorage.setItem(STORAGE_RANGO, r);
    } catch {
      // sin storage: solo dura la sesion de la pagina
    }
  }

  const esCalefaccion = tipo === "calefaccion";
  const unit = esCalefaccion ? "°C" : "%";
  const [min, max] = esCalefaccion
    ? [dispositivo.tempMin, dispositivo.tempMax]
    : [dispositivo.humMin, dispositivo.humMax];
  const refLines: RefLine[] = [
    ...(min != null ? [{ value: min, label: t("refMin", { v: fmt.number(min, min % 1 ? 1 : 0) }) }] : []),
    ...(max != null ? [{ value: max, label: t("refMax", { v: fmt.number(max, max % 1 ? 1 : 0) }) }] : []),
  ];
  const actuadorLabel = esCalefaccion ? t("calefaccion") : t("humidificador");

  return (
    <SectionCard
      number={number}
      title={t("title")}
      meta={`${dispositivo.nombre} · ${dispositivo.influxId}`}
      actions={
        vinculados.length > 1 ? (
          <SegmentedControl
            aria-label={t("dispositivo")}
            value={dispositivo._id}
            onChange={setDispositivoId}
            options={vinculados.map((d) => ({ value: d._id, label: d.nombre }))}
          />
        ) : undefined
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Tabs value={tipo} onValueChange={(v) => setTipo(v as TipoSerie)}>
            <TabsList>
              <TabsTrigger value="calefaccion">{t("tabCalefaccion")}</TabsTrigger>
              <TabsTrigger value="humedad">{t("tabHumedad")}</TabsTrigger>
            </TabsList>
          </Tabs>
          <SegmentedControl<Rango>
            aria-label={t("rango")}
            value={range}
            onChange={elegirRango}
            options={RANGOS.map((r) => ({ value: r, label: t(`rango_${r}`) }))}
          />
        </div>

        <ul className="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0 text-xs text-text-muted">
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[2px]" style={{ background: COLOR_PRENDIDO }} />
            {t("leyendaPrendida", { tipo })}
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[2px]" style={{ background: COLOR_APAGADO }} />
            {t("leyendaApagada", { tipo })}
          </li>
          <li className="flex items-center gap-1.5">
            <svg width="16" height="4" aria-hidden="true">
              <line x1="0" x2="16" y1="2" y2="2" stroke="var(--color-text)" strokeOpacity={0.7} strokeDasharray="4 3" />
            </svg>
            {refLines.length ? t("leyendaRef") : t("leyendaRefVacia")}
          </li>
        </ul>

        {estado.tipo === "cargando" ? (
          <EmptyState className="flex h-[240px] items-center justify-center">{t("cargando")}</EmptyState>
        ) : estado.tipo === "error" ? (
          <div
            role="alert"
            className="flex h-[240px] items-center justify-center gap-2 px-4 text-center text-[13px] text-danger-text"
          >
            <WarningCircleIcon className="size-4 shrink-0" />
            {estado.mensaje}
          </div>
        ) : estado.serie.rows.length === 0 ? (
          <EmptyState className="flex h-[240px] items-center justify-center">{t("sinDatos")}</EmptyState>
        ) : (
          <>
            <BarChart
              rows={estado.serie.rows}
              windowSec={estado.serie.windowSec}
              range={estado.serie.range}
              desde={estado.serie.desde}
              hasta={estado.serie.hasta}
              unit={unit}
              refLines={refLines}
              valorLabel={esCalefaccion ? t("temperatura") : t("humedad")}
              actuadorLabel={actuadorLabel}
              tipo={tipo}
            />
            <CiclosTable
              rows={estado.serie.rows}
              windowSec={estado.serie.windowSec}
              range={estado.serie.range}
              hasta={estado.serie.hasta}
              unit={unit}
              tipo={tipo}
            />
          </>
        )}
      </div>
    </SectionCard>
  );
}
