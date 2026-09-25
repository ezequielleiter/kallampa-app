"use client";

import { useTranslations } from "next-intl";
import {
  HourglassMediumIcon,
  WarningCircleIcon,
  ArrowRightIcon,
  BasketIcon,
} from "@phosphor-icons/react";
import { PendingList, type PendingItem } from "@/components/kallampa/PendingList";
import { alertaRecipiente } from "@/lib/recipiente-utils";
import type { Jar, Recipiente } from "@/lib/types";
import { codigoCorto } from "./lote-view";

/**
 * "Pendientes" del lote, derivados en el cliente del estado de frascos y
 * recipientes: primero lo que requiere atencion (demoras, contaminados) y
 * despues lo que esta en curso.
 */
export function LotePendientes({ jars, recipientes }: { jars: Jar[]; recipientes: Recipiente[] }) {
  const t = useTranslations("components.lotePendientes");
  const urgentes: PendingItem[] = [];
  const enCurso: PendingItem[] = [];

  for (const jar of jars) {
    if (jar.estado === "contaminado") {
      urgentes.push({
        key: `jar-${jar._id}`,
        icon: <WarningCircleIcon />,
        tone: "danger",
        text: t("frascoContaminado", { codigo: codigoCorto(jar.numeroGuia) }),
      });
    }
  }

  const colonizados = jars.filter((j) => j.estado === "colonizado").length;
  if (colonizados > 0) {
    enCurso.push({
      key: "jars-colonizados",
      icon: <ArrowRightIcon />,
      text: t("frascosColonizados", { count: colonizados }),
    });
  }

  for (const r of recipientes) {
    const alerta = alertaRecipiente(r);
    if (alerta.diasTranscurridos === null || alerta.diasEsperados === null) continue;
    const codigo = codigoCorto(r.numeroSeguimiento);
    const params = { codigo, dia: alerta.diasTranscurridos, total: alerta.diasEsperados };
    if (alerta.demorado) {
      urgentes.push({
        key: `rec-${r._id}`,
        icon: <WarningCircleIcon />,
        tone: "danger",
        text:
          r.estado === "incubando"
            ? t("incubacionDemorada", params)
            : t("fructificacionDemorada", params),
      });
    } else if (r.estado === "incubando") {
      enCurso.push({
        key: `rec-${r._id}`,
        icon: <HourglassMediumIcon />,
        text: t("incubando", params),
      });
    } else if (r.estado === "fructificando") {
      enCurso.push({
        key: `rec-${r._id}`,
        icon: <BasketIcon />,
        text: t("fructificando", params),
      });
    }
  }

  return <PendingList title={t("title")} empty={t("empty")} items={[...urgentes, ...enCurso]} />;
}
