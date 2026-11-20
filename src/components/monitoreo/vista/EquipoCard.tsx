"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { DropIcon, FanIcon, FlameIcon, WarningCircleIcon, type Icon } from "@phosphor-icons/react";
import { useFormat } from "@/components/kallampa/useFormat";
import { cn } from "@/lib/utils";
import type { Aparato, EquipoResumen, RangoObjetivo } from "@/lib/monitoreo/tipos";
import { RangoBarra, Sparkline, dominio } from "./Instrumentos";
import { useHace } from "./useHace";

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
}: {
  equipo: EquipoResumen;
  invernadero: { _id: string; nombre: string };
  ahora: number;
}) {
  const t = useTranslations("pages.monitoreo");
  const fmt = useFormat();
  const hace = useHace();
  const { conexion, dia } = equipo;
  const ultimoDato = equipo.ultimoEstado ?? equipo.ahora.t;
  const offline = conexion === "desconectado";

  return (
    <article
      className={cn(
        "flex min-h-0 min-w-0 flex-col rounded-lg border bg-surface-card",
        offline || equipo.alarmas.length ? "border-danger/60" : "border-divider"
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-divider px-4 py-2.5">
        <div className="min-w-0">
          <div className="truncate text-xs tracking-[0.08em] text-text-subtle uppercase">{invernadero.nombre}</div>
          <h2 className="m-0 truncate text-[15px] font-medium">{equipo.nombre}</h2>
        </div>
        <div className="flex items-center gap-2 text-xs tabular-nums">
          <span
            aria-hidden="true"
            className={cn(
              "inline-block size-2.5 shrink-0 rounded-full",
              conexion === "conectado" && "bg-accent shadow-[0_0_8px_var(--color-accent)]",
              offline && "bg-danger",
              (conexion === "sin_datos" || conexion === "sin_influx") && "bg-neutral-500"
            )}
          />
          <span className={cn("font-medium tracking-[0.06em] uppercase", offline ? "text-danger-text" : "text-text-body")}>
            {t(`conexion.${conexion}`)}
          </span>
          {ultimoDato != null && conexion !== "sin_influx" && (
            <span className={offline ? "text-danger-text" : "text-text-subtle"}>
              {t("sala.hace", { tiempo: hace(ahora - ultimoDato) })}
            </span>
          )}
        </div>
      </header>

      {conexion === "sin_influx" ? (
        <p className="m-0 p-4 text-[13px] text-text-subtle">
          {t("sinInfluxAyuda")}{" "}
          <Link href={`/invernaderos/${invernadero._id}`} className="text-text-accent underline-offset-4 hover:underline">
            {t("verInvernadero")}
          </Link>
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-x-5 gap-y-4">
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

          <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0">
            {APARATOS.map(({ key, icon }) => (
              <AparatoLuz
                key={key}
                icon={icon}
                label={t(`aparatos.${key}`)}
                aparato={equipo.aparatos[key]}
                uso={dia.usoPct[key]}
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
        <footer className="flex flex-wrap gap-x-3 gap-y-0.5 border-t border-divider px-4 py-2 font-tele text-xs text-text-subtle tabular-nums">
          {dia.temp && <span>{t("sala.t24", { min: fmt.number(dia.temp.min, 1), max: fmt.number(dia.temp.max, 1) })}</span>}
          {dia.hum && <span>{t("sala.h24", { min: fmt.number(dia.hum.min, 1), max: fmt.number(dia.hum.max, 1) })}</span>}
          <span>{t("reinicios", { count: dia.reinicios })}</span>
          {dia.rssi != null && <span>{t("sala.rssi", { rssi: dia.rssi })}</span>}
          {dia.fw && <span>{t("sala.fw", { fw: dia.fw.split(" ")[0] })}</span>}
          {equipo.vaciandoCola && <span>{t("sala.cola")}</span>}
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
  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-xs">
        <span className="tracking-[0.08em] text-text-subtle uppercase">{label}</span>
        <span className="text-text-subtle tabular-nums">{t("sala.objetivo", { rango: formatoRango(rango, unidad) })}</span>
      </div>
      <div className={cn("flex flex-wrap items-baseline gap-x-2", fuera ? "text-danger-text" : "text-text-strong")}>
        <span className="font-tele text-[clamp(2rem,3.2vw,3.25rem)] leading-none font-medium tabular-nums">
          {valor == null ? "—" : fmt.number(valor, 1)}
        </span>
        <span className="text-lg text-text-muted">{unidad}</span>
        {fuera && (
          <span className="text-xs font-medium tracking-[0.06em] uppercase">
            {fuera === "alta" ? "▲" : "▼"} {t(fuera)}
          </span>
        )}
      </div>
      <RangoBarra valor={valor} rango={rango} dom={dom} fuera={fuera != null} />
      <div className="min-h-12 flex-1 lg:min-h-16">
        <Sparkline valores={serie} rango={rango} dom={dom} fuera={fuera != null} />
      </div>
      <div className="flex justify-between gap-2 text-xs whitespace-nowrap text-text-subtle tabular-nums">
        <span className="max-sm:hidden">{t("sala.hace24h")}</span>
        {enRango != null && <span>{t("sala.enRango24", { pct: fmt.pct(enRango, 0) })}</span>}
        <span className="max-sm:hidden">{t("sala.ahora")}</span>
      </div>
    </div>
  );
}

function AparatoLuz({
  icon: IconC,
  label,
  aparato,
  uso,
}: {
  icon: Icon;
  label: string;
  aparato: Aparato;
  uso: number;
}) {
  const t = useTranslations("pages.monitoreo");
  const fmt = useFormat();
  const on = aparato.on === true;
  return (
    <li
      className={cn(
        "flex min-w-0 flex-col gap-1.5 rounded-md border px-2.5 py-2",
        on ? "border-accent/50 bg-accent/10" : "border-divider bg-surface-inset"
      )}
    >
      <div className="flex items-center gap-1.5 text-xs">
        <IconC aria-hidden="true" className={cn("size-4 shrink-0", on ? "text-accent-300" : "text-text-subtle")} />
        <span className="truncate text-text-muted">{label}</span>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-1.5">
        <span className={cn("font-tele text-sm font-medium tracking-[0.06em] uppercase", on ? "text-text-strong" : "text-text-subtle")}>
          {aparato.on == null ? t("sinDato") : on ? t("sala.on") : t("sala.off")}
        </span>
        {aparato.potencia != null && (
          <span className="font-tele text-xs whitespace-nowrap text-text-muted tabular-nums">{fmt.pct(aparato.potencia, 0)}</span>
        )}
      </div>
      <div aria-hidden="true" className="h-1 overflow-hidden rounded-full bg-neutral-800">
        <div className="h-full rounded-full bg-accent/70" style={{ width: `${Math.min(100, uso)}%` }} />
      </div>
      <div className="text-xs whitespace-nowrap text-text-subtle tabular-nums">
        {t("sala.uso24", { pct: fmt.pct(uso, 0) })}
        {aparato.aprendiendo && ` · ${t("aprendiendo")}`}
      </div>
    </li>
  );
}
