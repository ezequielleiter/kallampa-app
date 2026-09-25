"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  DropIcon,
  ThermometerSimpleIcon,
  WindIcon,
  FanIcon,
  type Icon,
} from "@phosphor-icons/react";
import { useFormat } from "@/components/kallampa/useFormat";

const N = 24;

/** Serie inicial determinista (igual en servidor y cliente). */
function serieInicial(base: number, amp: number, seed: number): number[] {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  let v = base;
  return Array.from({ length: N }, () => {
    v += (rnd() - 0.5) * amp;
    v = base + (v - base) * 0.8;
    return v;
  });
}

function paso(a: number[], base: number, amp: number, lo: number, hi: number) {
  let v = a[a.length - 1] + (Math.random() - 0.5) * amp;
  v += (base - v) * 0.15;
  return [...a.slice(1), Math.min(hi, Math.max(lo, v))];
}

function spark(a: number[], lo: number, hi: number, tLo: number, tHi: number) {
  const y = (v: number) => 34 - ((v - lo) / (hi - lo)) * 32;
  const path = a
    .map((v, i) => `${i ? "L" : "M"}${((i * 120) / (a.length - 1)).toFixed(1)} ${y(v).toFixed(1)}`)
    .join("");
  return { path, lastY: y(a[a.length - 1]), bandY: y(tHi), bandH: y(tLo) - y(tHi) };
}

/**
 * Panel de ejemplo del hero: un invernadero con lecturas que cambian en vivo.
 * Es ilustrativo (datos simulados), no lee ningun equipo.
 */
export function GreenhousePanel() {
  const t = useTranslations("pages.landing.panel");
  const fmt = useFormat();
  const [hum, setHum] = useState(() => serieInicial(88.4, 1.6, 11));
  const [temp, setTemp] = useState(() => serieInicial(21.4, 0.4, 23));
  const [co2, setCo2] = useState(() => serieInicial(780, 60, 37));

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setHum((a) => paso(a, 88.4, 1.8, 83, 94));
      setTemp((a) => paso(a, 21.4, 0.45, 19.5, 23.5));
      setCo2((a) => paso(a, 780, 70, 600, 980));
    }, 1400);
    return () => clearInterval(id);
  }, []);

  const last = (a: number[]) => a[a.length - 1];
  const lecturas: {
    icon: Icon;
    label: string;
    value: string;
    unit: string;
    target: string;
    s: ReturnType<typeof spark>;
  }[] = [
    { icon: DropIcon, label: t("humedad"), value: fmt.number(last(hum), 1), unit: "% HR", target: "85–92 %", s: spark(hum, 80, 96, 85, 92) },
    { icon: ThermometerSimpleIcon, label: t("temperatura"), value: fmt.number(last(temp), 1), unit: "°C", target: "20–23 °C", s: spark(temp, 18.5, 24.5, 20, 23) },
    { icon: WindIcon, label: t("co2"), value: fmt.number(last(co2), 0), unit: "ppm", target: "< 900 ppm", s: spark(co2, 550, 1050, 600, 900) },
  ];

  const muted = "text-text/62";
  return (
    <div
      role="img"
      aria-label={t("aria")}
      className="landing-rise flex w-full max-w-[460px] flex-col gap-1.5 justify-self-end rounded-lg bg-surface p-5 shadow-md"
      style={{ animationDelay: ".35s", animationDuration: "1s" }}
    >
      <div className="flex items-center justify-between gap-3 pb-2.5">
        <div>
          <div className="text-[15px] font-medium">{t("titulo")}</div>
          <div className={`mt-0.5 text-[12.5px] ${muted}`}>{t("sub")}</div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-accent-800 px-2.5 py-[3px] text-[11px] tracking-[0.02em] text-accent-100">
          <span className="size-1.5 rounded-full bg-accent animate-[k-blink_1.6s_ease-in-out_infinite]" />
          {t("automatico")}
        </span>
      </div>

      {lecturas.map((r) => (
        <div
          key={r.label}
          className="grid grid-cols-[28px_minmax(0,1fr)_120px] items-center gap-3 border-t border-divider py-3"
        >
          <r.icon className="size-5 text-accent" />
          <div>
            <div className={`text-xs tracking-[0.05em] uppercase ${muted}`}>{r.label}</div>
            <div className="mt-[3px] flex items-baseline gap-1 tabular-nums">
              <span className="text-[26px] font-medium tracking-[-0.01em]">{r.value}</span>
              <span className={`text-[13px] ${muted}`}>{r.unit}</span>
            </div>
            <div className="mt-0.5 text-xs text-text/55">{t("objetivo", { v: r.target })}</div>
          </div>
          <svg viewBox="0 0 120 36" width="120" height="36" aria-hidden="true" className="overflow-visible">
            <rect x="0" y={r.s.bandY} width="120" height={r.s.bandH} fill="var(--color-accent-900)" opacity=".7" />
            <path d={r.s.path} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="120" cy={r.s.lastY} r="3" fill="var(--color-accent-200)" />
          </svg>
        </div>
      ))}

      <div className="grid grid-cols-3 gap-2 border-t border-divider pt-3">
        <Actuador
          icon={<DropIcon className="size-[18px] text-accent animate-[l-drip_1.4s_ease-in_infinite]" />}
          nombre={t("nebulizador")}
          estado={t("encendido")}
        />
        <Actuador
          icon={<FanIcon className="size-[18px] text-accent animate-[k-spin_1.8s_linear_infinite]" />}
          nombre={t("extractor")}
          estado="40 %"
        />
        <Actuador
          icon={<ThermometerSimpleIcon className="size-[18px] text-neutral-400" />}
          nombre={t("calefactor")}
          estado={t("enEspera")}
        />
      </div>
    </div>
  );
}

function Actuador({ icon, nombre, estado }: { icon: React.ReactNode; nombre: string; estado: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md bg-neutral-900 p-2.5">
      {icon}
      <span className="text-[12.5px]">{nombre}</span>
      <span className="text-[11.5px] text-text/60">{estado}</span>
    </div>
  );
}
