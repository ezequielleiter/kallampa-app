"use client";

import { useTranslations } from "next-intl";
import { Plate } from "@/components/iso/react/draw";
import type { ModeloInvernadero } from "@/lib/invernadero-modelos";
import type { ArteFigura } from "../tipos";
import type { EstadoFigura } from "./model";
import { FructificacionVivo } from "./live";
import "@/components/iso/iso.css";
import "./fructificacion.css";

export function FiguraInvernadero({ arte, estado, nombre }: { modelo?: ModeloInvernadero | null; arte: ArteFigura | undefined; estado: EstadoFigura; nombre: string }) {
  const t = useTranslations("pages.monitoreo.figura");
  // El registro del servidor solo trae arte para los modelos que tienen figura.
  if (!arte) return null;
  const aparato = (on: boolean | null) => (on === null ? t("sinDato") : on ? t("prendido") : t("apagado"));
  const num = (n: number | null) => (n === null ? t("sinDato") : n.toFixed(1));
  // Sin dato vigente de los aparatos no se anima nada: se dice eso en vez de mostrar guiones.
  const sinNada = estado.humidificador === null && estado.extractor === null;
  const lectura = sinNada
    ? t("sinDatos")
    : t("lectura", { hum: aparato(estado.humidificador), ext: aparato(estado.extractor), temp: num(estado.temperatura), humedad: num(estado.humedad) });
  return (
    <div className="iso fr-tarjeta">
      <Plate fig={t("fig")} title={nombre} caption={t("pista")} readout={<span aria-live="polite">{lectura}</span>}>
        <FructificacionVivo arte={arte} estado={estado} label={`${nombre}: ${lectura}`} />
      </Plate>
    </div>
  );
}
