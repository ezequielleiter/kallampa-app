"use client";

import { useTranslations } from "next-intl";
import "./landing.css";
import { LandingNav } from "./LandingNav";
import { Mycelium } from "./Mycelium";
import { GreenhousePanel } from "./GreenhousePanel";
import { Pipeline } from "./Pipeline";
import { Modules } from "./Modules";
import { Automation } from "./Automation";
import { ContactSection } from "./ContactSection";
import { LandingFooter } from "./LandingFooter";

/**
 * Landing publica de Kallampa. Implementa "Kallampa Landing.dc.html" (Claude
 * Design): hero con micelio y panel de invernadero en vivo, trazabilidad,
 * modulos, automatizacion y contacto. Los datos que se ven son ilustrativos.
 */
export function Landing() {
  const t = useTranslations("pages.landing.hero");
  return (
    <div className="landing">
      <LandingNav />

      <header className="relative mx-auto max-w-[1200px] px-[clamp(20px,5vw,72px)] pt-[clamp(56px,9vw,112px)] pb-[clamp(56px,8vw,96px)]">
        <Mycelium />
        <div className="relative grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-center gap-[clamp(40px,6vw,88px)]">
          <div>
            <h1 className="landing-rise m-0 -ml-[0.05em] text-[clamp(42px,6vw,80px)] leading-[1.08] font-medium tracking-[-0.02em]">
              <span className="block">{t("titulo1")}</span>
              <span className="block text-accent-300">{t("titulo2")}</span>
            </h1>
            <p
              className="landing-rise mt-7 mb-0 max-w-[52ch] text-[17px] leading-7 text-text/82"
              style={{ animationDelay: ".15s" }}
            >
              {t("bajada")}
            </p>
          </div>
          <GreenhousePanel />
        </div>
      </header>

      <Pipeline />
      <Modules />
      <Automation />
      <ContactSection />
      <LandingFooter />
    </div>
  );
}
