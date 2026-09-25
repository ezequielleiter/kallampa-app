"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { KpiGrid } from "@/components/kallampa/Kpi";
import { useFormat } from "@/components/kallampa/useFormat";
import { resumenConsumo } from "@/lib/monitoreo/consumo";
import type { SerieRow } from "@/lib/monitoreo/tipos";
import { formatDuracion, formatEnergia } from "./formato";

/**
 * Consumo electrico estimado de la calefaccion en el rango visible: tiempo
 * prendida × potencia del calefactor (del dispositivo) × precio del kWh (del
 * invernadero).
 */
export function ConsumoResumen({
  rows,
  calefactorKw,
  precioKwh,
}: {
  rows: SerieRow[];
  calefactorKw?: number;
  precioKwh?: number;
}) {
  const t = useTranslations("components.monitoreo");
  const fmt = useFormat();
  const { prendidaSeg, kwh, costo } = useMemo(
    () => resumenConsumo(rows, calefactorKw, precioKwh),
    [rows, calefactorKw, precioKwh]
  );
  const dinero = (v: number) => fmt.money(v, v < 100 ? 2 : 0);

  return (
    <div>
      <h3 className="m-0 mb-2 text-[13.5px] font-medium">{t("consumoTitle")}</h3>
      <KpiGrid
        items={[
          { label: t("consumoPrendida"), value: formatDuracion(prendidaSeg, fmt.number) },
          ...(kwh != null && calefactorKw != null
            ? [
                {
                  label: t("consumoEnergia"),
                  value: formatEnergia(kwh, fmt.number),
                  note: t("consumoPotenciaNota", { kw: fmt.number(calefactorKw, calefactorKw % 1 ? 2 : 0) }),
                },
                {
                  label: t("consumoCosto"),
                  value: costo != null ? dinero(costo) : "—",
                  note:
                    costo != null && precioKwh != null
                      ? t("consumoCostoNota", { precio: dinero(precioKwh) })
                      : t("consumoSinPrecio"),
                },
              ]
            : []),
        ]}
      />
      {kwh == null && (
        <p className="mt-2 mb-0 text-xs leading-[17px] text-text-subtle">{t("consumoSinPotencia")}</p>
      )}
    </div>
  );
}
