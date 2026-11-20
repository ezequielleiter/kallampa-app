"use client";

import { useTranslations } from "next-intl";
import { useFormat } from "@/components/kallampa/useFormat";
import type { GestionResumen } from "@/lib/types";

/** Frascos y recipientes por estado (2 × 2 cifras grandes) mas los contaminados de los ultimos 30 dias. */
export function InventarioVivo({ data }: { data: GestionResumen }) {
  const t = useTranslations("pages.monitoreo");
  const fmt = useFormat();
  const { frascos, recipientes } = data;
  const contaminados = frascos.contaminados30d + recipientes.contaminados30d;
  const cifras = [
    { label: t("frascosColonizando"), value: frascos.colonizando },
    { label: t("frascosColonizados"), value: frascos.colonizado },
    { label: t("recipientesIncubando"), value: recipientes.incubando },
    { label: t("recipientesFructificando"), value: recipientes.fructificando },
  ];
  return (
    <div className="flex flex-col gap-3">
      <dl className="m-0 grid grid-cols-2 gap-2">
        {cifras.map((c) => (
          <div key={c.label} className="flex flex-col-reverse gap-1 rounded-md bg-surface-inset px-3 py-2">
            <dt className="text-xs text-text-subtle">{c.label}</dt>
            <dd className="m-0 font-tele text-2xl leading-none font-medium text-text-strong tabular-nums">{fmt.number(c.value)}</dd>
          </div>
        ))}
      </dl>
      <p className={contaminados > 0 ? "m-0 text-xs text-danger-text tabular-nums" : "m-0 text-xs text-text-subtle tabular-nums"}>
        {t("contaminados30d", { frascos: frascos.contaminados30d, recipientes: recipientes.contaminados30d })}
      </p>
    </div>
  );
}
