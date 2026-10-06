// Calculadora de sustrato: escala la receta de base (pellets + agua + cal
// viva, inoculado con grano colonizado) a partir del peso de pellets o del
// peso de grano que se tiene. Funciones puras, sin React.

/** Receta de base: 25,4012 kg (56 lb) de pellets, 40 L de agua, 0,56 kg de cal hidratada, 2,72 kg de grano. */
export const RECETA_BASE = { pelletsKg: 25.4012, aguaL: 40, calKg: 0.56, granoKg: 2.72 } as const;

export type BaseCalculo = "pellets" | "grano";

export interface CantidadesSustrato {
  pelletsKg: number;
  aguaL: number;
  calKg: number;
  granoKg: number;
}

/**
 * Escala la receta de base para que el ingrediente `base` pese `valor` kg.
 * Devuelve null si el valor no es un numero finito mayor a 0.
 */
export function calcularReceta(base: BaseCalculo, valor: number): CantidadesSustrato | null {
  if (!Number.isFinite(valor) || !(valor > 0)) return null;
  const referencia = base === "pellets" ? RECETA_BASE.pelletsKg : RECETA_BASE.granoKg;
  const factor = valor / referencia;
  return {
    pelletsKg: RECETA_BASE.pelletsKg * factor,
    aguaL: RECETA_BASE.aguaL * factor,
    calKg: RECETA_BASE.calKg * factor,
    granoKg: RECETA_BASE.granoKg * factor,
  };
}

/**
 * Total de sustrato humedo (pellets + agua, 1 L ≈ 1 kg, + cal) y tasa de
 * inoculacion (grano / sustrato humedo, en %).
 */
export function resumenReceta(c: CantidadesSustrato): {
  totalHumedoKg: number;
  tasaInoculacionPct: number;
} {
  const totalHumedoKg = c.pelletsKg + c.aguaL + c.calKg;
  const tasaInoculacionPct = totalHumedoKg > 0 ? (c.granoKg / totalHumedoKg) * 100 : 0;
  return { totalHumedoKg, tasaInoculacionPct };
}

/** Parsea un decimal escrito a mano, aceptando coma ("2,5"). "" → NaN. */
export function parseDecimal(v: string): number {
  const s = String(v).trim().replace(",", ".");
  if (s === "") return NaN;
  return Number(s);
}
