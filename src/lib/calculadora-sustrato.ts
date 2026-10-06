// Calculadora de sustrato: escala la receta de base (pellets + agua + cal
// viva, inoculado con grano colonizado) a partir del peso de pellets, del
// peso de grano que se tiene o de los tachos que hay que llenar. Funciones
// puras, sin React.

/** Receta de base: 25,4012 kg (56 lb) de pellets, 40 L de agua, 0,56 kg de cal hidratada, 2,72 kg de grano. */
export const RECETA_BASE = { pelletsKg: 25.4012, aguaL: 40, calKg: 0.56, granoKg: 2.72 } as const;

export type BaseCalculo = "pellets" | "grano" | "tachos";

/** Kg de mezcla final (pellets + agua + cal + grano) de la receta de base. */
export const TOTAL_MEZCLA_BASE_KG =
  RECETA_BASE.pelletsKg + RECETA_BASE.aguaL + RECETA_BASE.calKg + RECETA_BASE.granoKg;

/** Densidad aproximada de la mezcla humeda de pellets, en kg por litro. */
export const DENSIDAD_MEZCLA_DEFAULT = 0.6;

export type UnidadTacho = "kg" | "L";

/** Tachos a llenar con la mezcla final (sustrato humedo + grano). */
export interface ConfigTachos {
  cantidad: number;
  capacidad: number;
  unidad: UnidadTacho;
  /** kg por litro; solo se usa si la unidad es "L". */
  densidadKgL: number;
}

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
export function calcularReceta(
  base: Exclude<BaseCalculo, "tachos">,
  valor: number,
): CantidadesSustrato | null {
  if (!positivo(valor)) return null;
  const referencia = base === "pellets" ? RECETA_BASE.pelletsKg : RECETA_BASE.granoKg;
  return escalar(valor / referencia);
}

/**
 * Kg de mezcla que entran en los tachos (en litros se pasa a kg con la
 * densidad). Devuelve null si algun dato no es valido.
 */
export function kgMezclaTachos(cfg: ConfigTachos): number | null {
  if (!Number.isInteger(cfg.cantidad) || cfg.cantidad < 1) return null;
  if (!positivo(cfg.capacidad)) return null;
  if (cfg.unidad === "kg") return cfg.cantidad * cfg.capacidad;
  if (!positivo(cfg.densidadKgL)) return null;
  return cfg.cantidad * cfg.capacidad * cfg.densidadKgL;
}

/** Escala la receta de base para llenar los tachos con la mezcla final. */
export function calcularRecetaPorTachos(cfg: ConfigTachos): CantidadesSustrato | null {
  const kg = kgMezclaTachos(cfg);
  return kg == null ? null : escalar(kg / TOTAL_MEZCLA_BASE_KG);
}

function positivo(v: number) {
  return Number.isFinite(v) && v > 0;
}

function escalar(factor: number): CantidadesSustrato {
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
