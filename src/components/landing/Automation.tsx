"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRightIcon } from "@phosphor-icons/react";

/** Seccion "Automatizacion": reglas de ejemplo por etapa (interactivas, sin guardar). */
export function Automation() {
  const t = useTranslations("pages.landing.auto");
  const [activas, setActivas] = useState([true, true, true, false]);
  const reglas: [string, string, string][] = [
    ["HR < 85 %", t("reglas.hrAccion"), t("reglas.hrMeta")],
    ["CO₂ > 900 ppm", t("reglas.co2Accion"), t("reglas.co2Meta")],
    ["T < 19 °C", t("reglas.tBajaAccion"), t("reglas.tBajaMeta")],
    ["T > 26 °C", t("reglas.tAltaAccion"), t("reglas.tAltaMeta")],
  ];

  return (
    <section id="invernaderos" className="landing-wrap scroll-mt-4 pt-10 pb-[clamp(72px,9vw,112px)]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-center gap-x-[clamp(32px,6vw,96px)] gap-y-10 border-t border-neutral-800 pt-14">
        <div className="landing-reveal">
          <div className="landing-kicker text-accent">{t("kicker")}</div>
          <h2 className="landing-h2">{t("titulo")}</h2>
          <p className="mt-4 mb-0 max-w-[46ch] text-[15.5px] leading-[26px] text-text/78">{t("texto")}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {[t("tagHumedad"), t("tagTemperatura"), t("tagCo2"), t("tagAlertas")].map((tag) => (
              <span key={tag} className="rounded-[6px] bg-neutral-800 px-2.5 py-[3px] text-[11px] tracking-[0.02em] text-neutral-100">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="landing-reveal rounded-lg bg-surface px-[18px] py-1.5 shadow-md">
          {reglas.map(([cond, accion, meta], i) => {
            const on = activas[i];
            return (
              <div
                key={cond}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-divider py-3.5"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-[13.5px]">
                    <span className="text-text/60">{t("si")}</span>
                    {cond}
                    <ArrowRightIcon className="size-3.5 text-accent" />
                    {accion}
                  </div>
                  <div className="text-xs text-text/55">{meta}</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={t("activarRegla", { regla: `${cond} → ${accion}` })}
                  onClick={() => setActivas((a) => a.map((v, j) => (j === i ? !v : v)))}
                  className="relative h-5 w-[34px] cursor-pointer rounded-full border p-0 transition-all duration-250"
                  style={{
                    background: on ? "var(--color-accent-800)" : "var(--color-neutral-800)",
                    borderColor: on ? "var(--color-accent)" : "var(--color-neutral-600)",
                  }}
                >
                  <span
                    className="absolute top-[2px] size-3.5 rounded-full transition-all duration-250 ease-(--ease-out)"
                    style={{
                      left: on ? 16 : 2,
                      background: on ? "var(--color-accent-200)" : "var(--color-neutral-400)",
                    }}
                  />
                </button>
              </div>
            );
          })}
          <div className="flex items-center gap-2 py-3.5 text-[12.5px] text-text/64">
            <span className="relative size-2">
              <span className="absolute inset-0 rounded-full bg-accent" />
              <span className="absolute inset-0 rounded-full border border-accent animate-[l-ring_2s_ease-out_infinite]" />
            </span>
            {t("reglasActivas", { n: activas.filter(Boolean).length })}
          </div>
        </div>
      </div>
    </section>
  );
}
