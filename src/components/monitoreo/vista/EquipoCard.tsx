"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { DropIcon, FanIcon, FlameIcon, WarningCircleIcon, type Icon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { useFormat } from "@/components/kallampa/useFormat";
import { cn } from "@/lib/utils";
import type { Aparato, EquipoResumen, RangoObjetivo, Stats } from "@/lib/monitoreo/tipos";
import { useHace } from "./useHace";

const APARATOS: { key: keyof EquipoResumen["aparatos"]; icon: Icon }[] = [
  { key: "humidificador", icon: DropIcon },
  { key: "calefaccion", icon: FlameIcon },
  { key: "extractor", icon: FanIcon },
];

/**
 * Tarjeta de un equipo (ESP32): conexion, clima ahora contra el rango
 * objetivo, aparatos, alarmas y resumen de las ultimas 24 h.
 * `ahora` (epoch ms) es el reloj de la pagina, para "Desconectado hace …".
 */
export function EquipoCard({
  equipo,
  invernaderoId,
  ahora,
}: {
  equipo: EquipoResumen;
  invernaderoId: string;
  ahora: number;
}) {
  const t = useTranslations("pages.monitoreo");
  const fmt = useFormat();
  const hace = useHace();
  const { conexion, dia } = equipo;

  const conexionTexto =
    conexion === "desconectado" && equipo.ultimoEstado != null
      ? t("conexion.desconectadoHace", { tiempo: hace(ahora - equipo.ultimoEstado) })
      : t(`conexion.${conexion}`);

  const rango = (r: RangoObjetivo, unidad: string) => {
    const n = (v: number) => fmt.number(v, v % 1 ? 1 : 0);
    if (r.min != null && r.max != null) return `${n(r.min)}–${n(r.max)} ${unidad}`;
    if (r.min != null) return `≥ ${n(r.min)} ${unidad}`;
    if (r.max != null) return `≤ ${n(r.max)} ${unidad}`;
    return t("sinRango");
  };

  const stats = (s: Stats, unidad: string) =>
    t("stats", {
      min: fmt.number(s.min, 1),
      max: fmt.number(s.max, 1),
      prom: `${fmt.number(s.prom, 1)} ${unidad}`,
    });

  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-md bg-surface-inset p-3.5">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h3 className="m-0 min-w-0 text-sm font-medium break-words">{equipo.nombre}</h3>
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <span
            aria-hidden="true"
            className={cn(
              "inline-block size-2 shrink-0 rounded-full",
              conexion === "conectado" && "bg-accent",
              conexion === "desconectado" && "bg-danger",
              (conexion === "sin_datos" || conexion === "sin_influx") && "bg-neutral-500"
            )}
          />
          <span className={cn(conexion === "desconectado" && "text-danger-text")}>{conexionTexto}</span>
        </span>
      </header>

      {conexion === "sin_influx" ? (
        <p className="m-0 text-[13px] text-text-subtle">
          {t("sinInfluxAyuda")}{" "}
          <Link href={`/invernaderos/${invernaderoId}`} className="text-text-accent underline-offset-4 hover:underline">
            {t("verInvernadero")}
          </Link>
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Lectura
              label={t("temperatura")}
              valor={equipo.ahora.temperatura}
              unidad="°C"
              fuera={equipo.fueraTemp}
              rango={rango(equipo.rangoTemp, "°C")}
            />
            <Lectura
              label={t("humedad")}
              valor={equipo.ahora.humedad}
              unidad="%"
              fuera={equipo.fueraHum}
              rango={rango(equipo.rangoHum, "%")}
            />
          </div>

          <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[13px]">
            {APARATOS.map(({ key, icon }) => (
              <AparatoFila key={key} icon={icon} label={t(`aparatos.${key}`)} aparato={equipo.aparatos[key]} />
            ))}
          </ul>

          {equipo.alarmas.length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[13px] text-danger-text">
              {equipo.alarmas.map((a) => (
                <li key={a} className="flex items-center gap-1.5">
                  <WarningCircleIcon aria-hidden="true" className="size-4 shrink-0" />
                  {t(`alarmas.${a}`, { rssi: dia.rssi ?? "" })}
                </li>
              ))}
            </ul>
          )}

          {equipo.vaciandoCola && <p className="m-0 text-xs text-text-subtle">{t("vaciandoCola")}</p>}

          <div className="flex flex-col gap-1 border-t border-divider pt-2.5 text-xs text-text-muted tabular-nums">
            <div className="font-medium text-text-body">{t("ultimas24h")}</div>
            {dia.temp && (
              <div>
                {t("temperatura")}: {stats(dia.temp, "°C")}
                {dia.enRangoPct.temp != null && ` · ${t("enRango", { pct: fmt.pct(dia.enRangoPct.temp, 0) })}`}
              </div>
            )}
            {dia.hum && (
              <div>
                {t("humedad")}: {stats(dia.hum, "%")}
                {dia.enRangoPct.hum != null && ` · ${t("enRango", { pct: fmt.pct(dia.enRangoPct.hum, 0) })}`}
              </div>
            )}
            <div>
              {t("uso")}:{" "}
              {APARATOS.map(({ key }) => `${t(`aparatos.${key}`)} ${fmt.pct(dia.usoPct[key], 0)}`).join(" · ")}
            </div>
            <div className="text-text-subtle">
              {t("reinicios", { count: dia.reinicios })}
              {dia.ultimoReset && ` · ${t("ultimoReset", { reset: dia.ultimoReset })}`}
            </div>
            {dia.fw && <div className="text-text-subtle">{t("firmware", { fw: dia.fw })}</div>}
          </div>
        </>
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
}: {
  label: string;
  valor: number | null;
  unidad: string;
  fuera: "alta" | "baja" | null;
  rango: string;
}) {
  const t = useTranslations("pages.monitoreo");
  const fmt = useFormat();
  return (
    <div className="min-w-0">
      <div className="text-xs text-text-subtle">{label}</div>
      <div className={cn("mt-0.5 flex flex-wrap items-baseline gap-x-1.5", fuera && "text-danger-text")}>
        <span className="text-2xl font-medium tracking-[-0.01em] tabular-nums">
          {valor == null ? fmt.number(null) : `${fmt.number(valor, 1)} ${unidad}`}
        </span>
        {fuera && <span className="text-xs font-medium">{t(fuera)}</span>}
      </div>
      <div className="mt-0.5 text-xs text-text-subtle tabular-nums">{rango}</div>
    </div>
  );
}

function AparatoFila({ icon: IconC, label, aparato }: { icon: Icon; label: string; aparato: Aparato }) {
  const t = useTranslations("pages.monitoreo");
  const fmt = useFormat();
  const estado = aparato.on == null ? t("sinDato") : aparato.on ? t("prendido") : t("apagado");
  return (
    <li className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <IconC aria-hidden="true" className={cn("size-4 shrink-0", aparato.on ? "text-accent" : "text-text-subtle")} />
      <span className="text-text-muted">{label}</span>
      <span className={cn("ml-auto tabular-nums", aparato.on ? "text-text-body" : "text-text-subtle")}>
        {estado}
        {aparato.potencia != null && ` · ${fmt.pct(aparato.potencia, 0)}`}
      </span>
      {aparato.aprendiendo && (
        <Badge variant="secondary" className="text-xs">
          {t("aprendiendo")}
        </Badge>
      )}
    </li>
  );
}
