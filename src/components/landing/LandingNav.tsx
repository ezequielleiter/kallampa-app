"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SignInIcon, SquaresFourIcon } from "@phosphor-icons/react";
import { getSession } from "@/lib/session";

/** Logo con la animacion de entrada del diseño (micelio que crece + sombrero). */
function Marca() {
  return (
    <span className="flex items-center gap-2 text-lg font-medium tracking-[-0.02em]">
      <svg viewBox="0 0 48 48" width="28" height="28" aria-hidden="true" className="flex-none overflow-visible">
        <defs>
          <linearGradient id="kgnd" x1="0" x2="1">
            <stop offset="0" stopColor="var(--color-neutral-600)" stopOpacity="0" />
            <stop offset=".25" stopColor="var(--color-neutral-600)" />
            <stop offset=".75" stopColor="var(--color-neutral-600)" />
            <stop offset="1" stopColor="var(--color-neutral-600)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g
          style={{
            transformBox: "fill-box",
            transformOrigin: "50% 100%",
            animation: "k-cap .8s 1.3s cubic-bezier(.2,.7,.2,1) both",
          }}
        >
          <path d="M11 20 A13 11 0 0 1 37 20 Q24 23 11 20 Z" fill="var(--color-text)" />
          <path d="M21.6 21.4 L22.2 30 H25.8 L26.4 21.4 Z" fill="var(--color-text)" />
        </g>
        <path d="M3 30 H45" stroke="url(#kgnd)" strokeWidth="1" />
        <path
          d="M24 30 L16 36 L9 38 M16 36 L14 43 M24 30 L32 36 L39 38 M32 36 L34 43 M24 30 V44"
          pathLength={1}
          strokeDasharray={1}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ animation: "k-grow 1.4s .2s cubic-bezier(.3,.6,.3,1) both" }}
        />
      </svg>
      kallampa
    </span>
  );
}

export function LandingNav() {
  const t = useTranslations("pages.landing.nav");
  // Con sesion guardada, el boton lleva directo al panel en vez de al login.
  const [conSesion, setConSesion] = useState(false);
  useEffect(() => {
    void Promise.resolve().then(() => setConSesion(!!getSession()));
  }, []);

  return (
    <nav
      aria-label={t("menu")}
      className="relative z-[2] flex items-center gap-[var(--space-4)] py-[var(--space-3)]"
      style={{
        paddingInline:
          "max(clamp(20px,5vw,72px),calc((100% - 1200px) / 2 + clamp(20px,5vw,72px)))",
      }}
    >
      <Link href="/" className="mr-auto" aria-label="Kallampa">
        <Marca />
      </Link>
      <div className="hidden items-center gap-[var(--space-4)] text-sm md:flex">
        <a href="#modulos">{t("modulos")}</a>
        <a href="#trazabilidad">{t("trazabilidad")}</a>
        <a href="#invernaderos">{t("invernaderos")}</a>
        <a href="#contacto">{t("contacto")}</a>
      </div>
      {conSesion ? (
        <Link href="/lotes" className="landing-btn">
          <SquaresFourIcon className="size-[15px]" /> {t("panel")}
        </Link>
      ) : (
        <Link href="/login" className="landing-btn">
          <SignInIcon className="size-[15px]" /> {t("login")}
        </Link>
      )}
    </nav>
  );
}
