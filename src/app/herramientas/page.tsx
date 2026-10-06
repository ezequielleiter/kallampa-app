"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalculatorIcon, PaintBucketIcon } from "@phosphor-icons/react";
import { PageContainer, PageHeader } from "@/components/kallampa/PageHeader";
import { CalculadoraSustrato } from "@/components/herramientas/CalculadoraSustrato";
import { CalculadoraTachos } from "@/components/herramientas/CalculadoraTachos";
import { RECETA_BASE, type CantidadesSustrato } from "@/lib/calculadora-sustrato";

/** Mezcla final: pellets + agua (1 L ≈ 1 kg) + cal + grano. */
function totalMezclaKg(c: CantidadesSustrato) {
  return c.pelletsKg + c.aguaL + c.calKg + c.granoKg;
}

export default function HerramientasPage() {
  const t = useTranslations("pages.herramientas");
  // La calculadora de tachos arranca con el total de la de sustrato.
  const [totalKg, setTotalKg] = useState<number | null>(() => totalMezclaKg(RECETA_BASE));

  return (
    <PageContainer>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {/* Una card por herramienta, a todo el ancho. */}
      <div className="flex flex-col gap-4">
        <section className="rounded-lg bg-surface-card p-4 shadow-sm">
          <h2 className="m-0 flex items-center gap-2 text-sm font-medium">
            <CalculatorIcon className="size-4 text-accent" />
            {t("calculadoraSustratoTitle")}
          </h2>
          <p className="mt-1 mb-4 text-[13px] text-text-subtle">
            {t("calculadoraSustratoDescription")}
          </p>
          <CalculadoraSustrato
            onChange={(_base, _valor, c) => setTotalKg(c ? totalMezclaKg(c) : null)}
          />
        </section>

        <section className="rounded-lg bg-surface-card p-4 shadow-sm">
          <h2 className="m-0 flex items-center gap-2 text-sm font-medium">
            <PaintBucketIcon className="size-4 text-accent" />
            {t("calculadoraTachosTitle")}
          </h2>
          <p className="mt-1 mb-4 text-[13px] text-text-subtle">
            {t("calculadoraTachosDescription")}
          </p>
          <CalculadoraTachos totalSugeridoKg={totalKg} />
        </section>
      </div>
    </PageContainer>
  );
}
