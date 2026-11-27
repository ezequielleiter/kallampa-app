"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CaretDownIcon, CaretUpIcon, ChartLineIcon, DropIcon, FanIcon, FlameIcon, WarningCircleIcon, type Icon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useFormat } from "@/components/kallampa/useFormat";
import { cn } from "@/lib/utils";
import type { Aparato, EquipoResumen, RangoObjetivo } from "@/lib/monitoreo/tipos";
import { RangoBarra, Sparkline, dominio } from "./Instrumentos";
import { useHace } from "./useHace";
import type { Vivo } from "./useEnVivo";

const APARATOS: { key: keyof EquipoResumen["aparatos"]; icon: Icon }[] = [
  { key: "humidificador", icon: DropIcon },
  { key: "calefaccion", icon: FlameIcon },
  { key: "extractor", icon: FanIcon },
];

/** Formatea un rango objetivo ("27–28 °C"). */
export function useRango() {
  const t = useTranslations("pages.monitoreo");
  const fmt = useFormat();
  return (r: RangoObjetivo, unidad: string) => {
    const n = (v: number) => fmt.number(v, v % 1 ? 1 : 0);
    if (r.min != null && r.max != null) return `${n(r.min)}–${n(r.max)} ${unidad}`;
    if (r.min != null) return `≥ ${n(r.min)} ${unidad}`;
    if (r.max != null) return `≤ ${n(r.max)} ${unidad}`;
    return t("sinRango");
  };
}

/**
 * Panel de telemetria de un equipo (ESP32): conexion, clima ahora contra el
 * rango (barra + grafica de 24 h), aparatos como luces y pie con datos tecnicos.
 * `ahora` (epoch ms) es el reloj de la pagina.
 */
export function EquipoCard({
  equipo,
  invernadero,
  ahora,
  vivo,
}: {
  equipo: EquipoResumen;
  invernadero: { _id: string; nombre: string };
  ahora: number;
  /** Sondeo local del equipo; null = no se esta sondeando (se ve solo Influx). */
  vivo: Vivo | null;
}) {
  const t = useTranslations("pages.monitoreo");
  const fmt = useFormat();
  const hace = useHace();
  const { conexion, dia } = equipo;
  const ultimoDato = equipo.ultimoEstado ?? equipo.ahora.t;
  const s = vivo?.sensors ?? null;
  const sinLocal = vivo != null && s == null;
  const offline = s == null && conexion === "desconectado";
  const detalleExtractor = !s
    ? undefined
    : s.extractorPaused
      ? t("vivo.extPausa")
      : s.extractorWaitingHum
        ? t("vivo.extEsperando")
        : s.extractorRemaining != null
          ? t("vivo.extCambia", { t: mmss(s.extractorRemaining) })
          : undefined;

  return (
    <article
      className={cn(
        "flex min-w-0 flex-col rounded-lg border bg-surface-card",
        offline || equipo.alarmas.length ? "border-danger/60" : "border-divider"
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-divider px-4 py-2">
        <div className="min-w-0">
          <div className="truncate text-xs tracking-[0.08em] text-text-subtle uppercase">{invernadero.nombre}</div>
          <h2 className="m-0 truncate text-[15px] font-medium">{equipo.nombre}</h2>
        </div>
        <div className="flex items-center gap-2 text-xs tabular-nums">
          <span
            aria-hidden="true"
            className={cn(
              "inline-block size-2.5 shrink-0 rounded-full",
              s ? "bg-accent motion-safe:animate-pulse" : offline ? "bg-danger" : conexion === "conectado" && !sinLocal ? "bg-accent" : "bg-neutral-500"
            )}
          />
          <span className={cn("font-medium tracking-[0.06em] uppercase", offline ? "text-danger-text" : "text-text-body")}>
            {s ? t("vivo.enVivo") : sinLocal ? t("vivo.sinLocal") : t(`conexion.${conexion}`)}
          </span>
          {s ? (
            <HaceSeg at={vivo?.at ?? null} />
          ) : (
            ultimoDato != null &&
            conexion !== "sin_influx" && (
              <span className={offline ? "text-danger-text" : "text-text-subtle"}>
                {t("sala.hace", { tiempo: hace(ahora - ultimoDato) })}
              </span>
            )
          )}
        </div>
      </header>

      {conexion === "sin_influx" && !s ? (
        <p className="m-0 p-4 text-[13px] text-text-subtle">
          {t("sinInfluxAyuda")}{" "}
          <Link href={`/invernaderos/${invernadero._id}`} className="text-text-accent underline-offset-4 hover:underline">
            {t("verInvernadero")}
          </Link>
        </p>
      ) : (
        <div className="flex flex-col gap-3 px-4 py-3">
          <div className="grid grid-cols-2 gap-x-5">
            <Lectura
              label={t("temperatura")}
              valor={equipo.ahora.temperatura}
              unidad="°C"
              fuera={equipo.fueraTemp}
              rango={equipo.rangoTemp}
              serie={equipo.tendencia.temp}
              enRango={dia.enRangoPct.temp}
            />
            <Lectura
              label={t("humedad")}
              valor={equipo.ahora.humedad}
              unidad="%"
              fuera={equipo.fueraHum}
              rango={equipo.rangoHum}
              serie={equipo.tendencia.hum}
              enRango={dia.enRangoPct.hum}
            />
          </div>

          <ul className="m-0 flex list-none flex-col gap-1 border-t border-divider p-0 pt-3">
            {APARATOS.map(({ key, icon }) => (
              <AparatoFila
                key={key}
                icon={icon}
                label={t(`aparatos.${key}`)}
                aparato={equipo.aparatos[key]}
                uso={dia.usoPct[key]}
                detalle={key === "extractor" ? detalleExtractor : undefined}
              />
            ))}
          </ul>

          {equipo.alarmas.length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[13px] font-medium text-danger-text">
              {equipo.alarmas.map((a) => (
                <li key={a} className="flex items-center gap-1.5">
                  <WarningCircleIcon aria-hidden="true" className="size-4 shrink-0" />
                  {t(`alarmas.${a}`, { rssi: dia.rssi ?? "" })}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {conexion !== "sin_influx" && (
        <footer className="flex flex-wrap items-center gap-x-3 gap-y-0.5 border-t border-divider px-4 py-2 font-tele text-xs text-text-subtle tabular-nums">
          {dia.temp && <span>{t("sala.t24", { min: fmt.number(dia.temp.min, 1), max: fmt.number(dia.temp.max, 1) })}</span>}
          {dia.hum && <span>{t("sala.h24", { min: fmt.number(dia.hum.min, 1), max: fmt.number(dia.hum.max, 1) })}</span>}
          <span>{t("reinicios", { count: dia.reinicios })}</span>
          {dia.rssi != null && <span>{t("sala.rssi", { rssi: dia.rssi })}</span>}
          {dia.fw && <span>{t("sala.fw", { fw: dia.fw.split(" ")[0] })}</span>}
          {equipo.vaciandoCola && <span>{t("sala.cola")}</span>}
          <Button
            variant="outline"
            size="xs"
            className="ml-auto font-sans"
            render={<Link href={`/monitoreo/${invernadero._id}?dispositivo=${equipo.dispositivoId}`} />}
          >
            <ChartLineIcon aria-hidden="true" />
            {t("verMonitoreo")}
          </Button>
        </footer>
      )}
    </article>
  );
}

function Lectura({
  label,
  valor,
  unidad,
  fuera,
  rango,
  serie,
  enRango,
}: {
  label: string;
  valor: number | null;
  unidad: string;
  fuera: "alta" | "baja" | null;
  rango: RangoObjetivo;
  serie: (number | null)[];
  enRango: number | null;
}) {
  const t = useTranslations("pages.monitoreo");
  const fmt = useFormat();
  const formatoRango = useRango();
  const dom = dominio([...serie, valor], rango, unidad === "%" ? 10 : 3);
  const Flecha = fuera === "alta" ? CaretUpIcon : CaretDownIcon;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="tracking-[0.08em] text-text-subtle uppercase">{label}</span>
        {fuera && (
          <span className="flex items-center gap-0.5 font-medium tracking-[0.06em] text-danger-text uppercase">
            <Flecha aria-hidden="true" weight="fill" className="size-3" />
            {t(fuera)}
          </span>
        )}
      </div>
      <div className={cn("flex items-baseline gap-1", fuera ? "text-danger-text" : "text-text-strong")}>
        <span className="font-tele text-[2rem] leading-none font-medium tabular-nums">
          {valor == null ? "—" : fmt.number(valor, 1)}
        </span>
        <span className="text-sm text-text-muted">{unidad}</span>
      </div>
      <RangoBarra valor={valor} rango={rango} dom={dom} fuera={fuera != null} />
      <div className="h-10">
        <Sparkline valores={serie} rango={rango} dom={dom} fuera={fuera != null} />
      </div>
      <div className="flex flex-wrap justify-between gap-x-2 text-xs text-text-subtle tabular-nums [&>span]:whitespace-nowrap">
        <span>{t("sala.objetivo", { rango: formatoRango(rango, unidad) })}</span>
        {enRango != null && <span>{t("sala.enRango24", { pct: fmt.pct(enRango, 0) })}</span>}
      </div>
    </div>
  );
}

function AparatoFila({
  icon: IconC,
  label,
  aparato,
  uso,
  detalle,
}: {
  icon: Icon;
  label: string;
  aparato: Aparato;
  uso: number;
  detalle?: string;
}) {
  const t = useTranslations("pages.monitoreo");
  const fmt = useFormat();
  const on = aparato.on === true;
  return (
    <li className="flex min-h-6 items-center gap-2 text-xs tabular-nums">
      <IconC aria-hidden="true" className={cn("size-4 shrink-0", on ? "text-accent-300" : "text-text-subtle")} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-text-muted">{label}</span>
        {(aparato.aprendiendo || detalle) && (
          <span className="truncate text-[11px] leading-tight text-text-subtle">
            {[aparato.aprendiendo && t("aprendiendo"), detalle].filter(Boolean).join(" · ")}
          </span>
        )}
      </span>
      <span className="ml-auto whitespace-nowrap text-text-subtle">{t("sala.uso24", { pct: fmt.pct(uso, 0) })}</span>
      <span
        className={cn(
          "w-[7.5rem] shrink-0 rounded-sm px-1.5 py-0.5 text-right font-tele font-medium tracking-[0.04em] uppercase",
          on ? "bg-accent/15 text-text-strong" : "text-text-subtle"
        )}
      >
        {aparato.on == null ? t("sinDato") : on ? t("sala.on") : t("sala.off")}
        {aparato.potencia != null && ` ${fmt.pct(aparato.potencia, 0)}`}
      </span>
    </li>
  );
}

const mmss = (seg: number) => `${Math.floor(seg / 60)}:${String(Math.floor(seg % 60)).padStart(2, "0")}`;

/** "hace N s" desde la ultima respuesta del equipo, con reloj propio de 1 s. */
function HaceSeg({ at }: { at: number | null }) {
  const t = useTranslations("pages.monitoreo");
  const [ahora, setAhora] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setAhora(Date.now());
    void Promise.resolve().then(tick);
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  if (at == null || ahora == null) return null;
  return <span className="text-text-subtle">{t("vivo.haceSeg", { n: Math.max(0, Math.round((ahora - at) / 1000)) })}</span>;
}
