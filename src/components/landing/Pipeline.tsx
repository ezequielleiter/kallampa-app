"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BarcodeIcon } from "@phosphor-icons/react";

const ETAPAS = [
  "cepa",
  "clonacion",
  "inoculacion",
  "incubacion",
  "fructificacion",
  "cosecha",
  "venta",
] as const;

/** Seccion "Trazabilidad": un lote recorre sus 7 etapas, de la cepa a la venta. */
export function Pipeline({ velocidadSeg = 1.6 }: { velocidadSeg?: number }) {
  const t = useTranslations("pages.landing.traz");
  const [etapa, setEtapa] = useState(3);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setEtapa((e) => (e + 1) % ETAPAS.length), velocidadSeg * 1000);
    return () => clearInterval(id);
  }, [velocidadSeg]);

  return (
    <section id="trazabilidad" className="landing-band scroll-mt-4 py-[clamp(48px,7vw,80px)]">
      <div className="landing-wrap">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div>
            <div className="landing-kicker text-text/64">{t("kicker")}</div>
            <h2 className="landing-h2">{t("titulo")}</h2>
          </div>
          <div className="flex items-center gap-2.5 text-[13px] text-text/72 tabular-nums">
            <BarcodeIcon className="size-[18px]" />
            {t("lote")} · <i>{t("especie")}</i>
          </div>
        </div>

        <div className="-mx-[clamp(20px,5vw,72px)] overflow-x-auto px-[clamp(20px,5vw,72px)] pb-2">
          <div className="relative min-w-[840px]">
            <div
              aria-hidden="true"
              className="absolute top-[7px] left-[7px] h-px"
              style={{
                width: "calc((100% + 12px) * 6 / 7)",
                background:
                  "repeating-linear-gradient(to right,var(--color-section-ghost) 0 6px,transparent 6px 12px)",
              }}
            />
            <div
              aria-hidden="true"
              className="absolute top-[7px] left-[7px] h-px bg-text transition-[width] duration-600 ease-(--ease-out)"
              style={{ width: `calc((100% + 12px) * ${etapa} / 7)` }}
            />
            <ol className="relative m-0 grid list-none grid-cols-7 gap-x-3 p-0">
              {ETAPAS.map((k, i) => {
                const hecha = i < etapa;
                const activa = i === etapa;
                return (
                  <li key={k} className="flex flex-col gap-2.5" aria-current={activa ? "step" : undefined}>
                    <span
                      className="box-border block size-[15px] rounded-full border transition-all duration-400"
                      style={{
                        background: hecha || activa ? "var(--color-text)" : "var(--color-section)",
                        borderColor: hecha || activa ? "var(--color-text)" : "var(--color-section-ghost)",
                        boxShadow: activa
                          ? "0 0 0 5px color-mix(in srgb,var(--color-text) 18%,transparent),0 0 18px var(--color-section-ghost)"
                          : "none",
                      }}
                    />
                    <div
                      className={`text-[15px] font-medium transition-colors duration-400 ${hecha || activa ? "text-text" : "text-text/64"}`}
                    >
                      {t(`etapas.${k}`)}
                    </div>
                    <div className="text-[12.5px] leading-[18px] text-text/64 tabular-nums">
                      {t(`metas.${k}`)}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
