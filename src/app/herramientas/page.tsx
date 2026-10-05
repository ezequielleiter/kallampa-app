"use client";

import { useTranslations } from "next-intl";
import { CalculatorIcon } from "@phosphor-icons/react";
import { PageContainer, PageHeader } from "@/components/kallampa/PageHeader";
import { CalculadoraSustrato } from "@/components/herramientas/CalculadoraSustrato";

export default function HerramientasPage() {
  const t = useTranslations("pages.herramientas");

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
          <CalculadoraSustrato />
        </section>
      </div>
    </PageContainer>
  );
}
