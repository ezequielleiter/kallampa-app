"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { useFormat } from "@/components/kallampa/useFormat";

/** Seccion "Modulos": cuatro filas con texto a la izquierda y una muestra a la derecha. */
export function Modules() {
  const t = useTranslations("pages.landing.modulos");
  return (
    <section id="modulos" className="landing-wrap scroll-mt-4 pt-[clamp(72px,9vw,112px)] pb-10">
      <div className="landing-kicker text-accent">{t("kicker")}</div>
      <h2 className="landing-h2 mb-6 max-w-[22ch]">{t("titulo")}</h2>

      <Fila numero="01" titulo={t("produccion.titulo")} texto={t("produccion.texto")}>
        <Produccion />
      </Fila>
      <Fila numero="02" titulo={t("contaminacion.titulo")} texto={t("contaminacion.texto")}>
        <Contaminacion />
      </Fila>
      <Fila numero="03" titulo={t("clonacion.titulo")} texto={t("clonacion.texto")}>
        <Linaje />
      </Fila>
      <Fila numero="04" titulo={t("costos.titulo")} texto={t("costos.texto")}>
        <Costos />
      </Fila>
    </section>
  );
}

function Fila({
  numero,
  titulo,
  texto,
  children,
}: {
  numero: string;
  titulo: string;
  texto: string;
  children: ReactNode;
}) {
  return (
    <div className="landing-reveal grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-center gap-x-[clamp(32px,6vw,96px)] gap-y-6 border-t border-neutral-800 py-10">
      <div className="grid grid-cols-[48px_minmax(0,1fr)] gap-x-4 gap-y-1">
        <span className="pt-[5px] text-[15px] text-accent tabular-nums">{numero}</span>
        <div>
          <h3 className="m-0 text-2xl font-medium tracking-[-0.01em]">{titulo}</h3>
          <p className="mt-2.5 mb-0 max-w-[46ch] text-[15.5px] leading-[26px] text-text/78">{texto}</p>
        </div>
      </div>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

function Tarjeta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-3 rounded-md bg-surface px-4 py-3.5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function Produccion() {
  const t = useTranslations("pages.landing.modulos.lotes");
  const lotes: [string, string, string, number][] = [
    [t("shiitake"), "SHI-L-2026-022", `${t("incubacion")} · 72 %`, 72],
    [t("ostra"), "OST-L-2026-007", `${t("fructificacion")} · 90 %`, 90],
    [t("melena"), "MDL-L-2026-012", `${t("inoculacion")} · 18 %`, 18],
  ];
  return (
    <Tarjeta>
      {lotes.map(([nombre, codigo, etapa, p], i) => (
        <div key={codigo} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 text-[13px]">
          <span>
            {nombre} <span className="text-text/55 tabular-nums">· {codigo}</span>
          </span>
          <span className="text-text/72 tabular-nums">{etapa}</span>
          <div className="col-span-full h-1 overflow-hidden rounded-[2px] bg-neutral-800">
            <div
              className="landing-fill h-full rounded-[2px] bg-accent"
              style={{ width: `${p}%`, animationDelay: `${(i * 0.15).toFixed(2)}s` }}
            />
          </div>
        </div>
      ))}
    </Tarjeta>
  );
}

function Contaminacion() {
  const t = useTranslations("pages.landing.modulos.contaminacion");
  return (
    <Tarjeta>
      <div className="grid grid-cols-10 gap-1.5">
        {Array.from({ length: 30 }, (_, i) => {
          const marcada = i === 13;
          return (
            <span
              key={i}
              className={`relative aspect-square rounded-sm border ${marcada ? "border-accent bg-accent-800" : "border-transparent bg-neutral-800"}`}
            >
              {marcada && (
                <span className="absolute inset-0 rounded-sm border border-accent animate-[l-ring_1.8s_ease-out_infinite]" />
              )}
            </span>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-2 text-[12.5px]">
        <span className="flex items-center gap-1.5">
          <WarningCircleIcon className="size-4 text-accent" />
          {t("alerta")}
        </span>
        <span className="text-text/60">{t("origen")}</span>
      </div>
    </Tarjeta>
  );
}

function Linaje() {
  const t = useTranslations("pages.landing.modulos.clonacion");
  const gen: [string, string][] = [
    [t("madre"), t("placa")],
    ["G1", "EB 74 %"],
    ["G2", "EB 82 %"],
    ["G3", t("enPrueba")],
  ];
  return (
    <div className="flex items-center overflow-x-auto rounded-md bg-surface p-4 shadow-sm">
      {gen.map(([nombre, meta], i) => (
        <div key={nombre} className="flex flex-[1_0_auto] items-center">
          {i > 0 && (
            <span className="landing-fill block h-px min-w-5 flex-1 bg-accent-600" style={{ animationRange: "entry 20% entry 90%" }} />
          )}
          <div
            className={`flex-none rounded-md px-3 py-2 ${i === 2 ? "bg-accent-900 shadow-[0_0_0_1px_var(--color-accent)]" : "bg-neutral-900 shadow-sm"}`}
          >
            <div className="text-[13px] font-medium">{nombre}</div>
            <div className="mt-0.5 text-[11.5px] text-text/60 tabular-nums">{meta}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const TONOS = [
  "var(--color-accent)",
  "var(--color-accent-700)",
  "var(--color-neutral-500)",
  "var(--color-neutral-700)",
];

function Costos() {
  const t = useTranslations("pages.landing.modulos.costos");
  const fmt = useFormat();
  const costos: [string, number][] = [
    [t("sustrato"), 38],
    [t("energia"), 27],
    [t("manoDeObra"), 24],
    [t("mermas"), 11],
  ];
  return (
    <Tarjeta>
      <div className="flex items-baseline justify-between text-[13px]">
        <span>{t("costoKg")}</span>
        <span className="text-[22px] font-medium tabular-nums">{fmt.money(3.82, 2)}</span>
      </div>
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-[4px]">
        {costos.map(([n, p], i) => (
          <span
            key={n}
            className="landing-fill"
            style={{ flex: p, background: TONOS[i], animationDuration: "1s", animationDelay: `${(i * 0.12).toFixed(2)}s` }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {costos.map(([n, p], i) => (
          <div key={n} className="flex justify-between gap-2 text-[12.5px]">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-[2px]" style={{ background: TONOS[i] }} />
              {n}
            </span>
            <span className="text-text/70 tabular-nums">{p} %</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between border-t border-divider pt-2.5 text-[12.5px]">
        <span className="text-text/64">{t("precioSugerido")}</span>
        <span className="text-accent-200 tabular-nums">{fmt.money(6.95, 2)} / kg</span>
      </div>
    </Tarjeta>
  );
}
