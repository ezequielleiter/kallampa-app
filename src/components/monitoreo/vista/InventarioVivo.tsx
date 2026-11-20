"use client";

import { useTranslations } from "next-intl";
import { KpiGrid } from "@/components/kallampa/Kpi";
import { useFormat } from "@/components/kallampa/useFormat";
import type { GestionResumen } from "@/lib/types";

/** Frascos y recipientes por estado, mas los contaminados de los ultimos 30 dias. */
export function InventarioVivo({ data }: { data: GestionResumen }) {
  const t = useTranslations("pages.monitoreo");
  const fmt = useFormat();
  const { frascos, recipientes } = data;
  const contaminados = frascos.contaminados30d + recipientes.contaminados30d;
  return (
    <div className="flex flex-col gap-3">
      <KpiGrid
        min={140}
        items={[
          { label: t("frascosColonizando"), value: fmt.number(frascos.colonizando) },
          { label: t("frascosColonizados"), value: fmt.number(frascos.colonizado) },
          { label: t("recipientesIncubando"), value: fmt.number(recipientes.incubando) },
          { label: t("recipientesFructificando"), value: fmt.number(recipientes.fructificando) },
        ]}
      />
      <p className={contaminados > 0 ? "m-0 text-[13px] text-danger-text tabular-nums" : "m-0 text-[13px] text-text-subtle tabular-nums"}>
        {t("contaminados30d", { frascos: frascos.contaminados30d, recipientes: recipientes.contaminados30d })}
      </p>
    </div>
  );
}
