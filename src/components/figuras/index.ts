import "server-only";
import type { ModeloInvernadero } from "@/lib/invernadero-modelos";
import type { ArteFigura } from "./tipos";
import { ARTE_FRUCTIFICACION } from "./fructificacion/arte";

/** Arte de cada modelo de invernadero que tiene figura en vivo. */
export const ARTE_FIGURAS: Partial<Record<ModeloInvernadero, ArteFigura>> = {
  kallampa_fructificacion_1: ARTE_FRUCTIFICACION,
};
