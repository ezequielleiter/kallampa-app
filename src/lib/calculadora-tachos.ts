// Calculadora de tachos: cuantos tachos hacen falta para la cantidad final de
// sustrato inoculado (sustrato humedo + grano), segun el tamaño del tacho en
// kg o en litros. Funciones puras, sin React.

/** Densidad aproximada de la mezcla humeda de pellets con grano, en kg por litro. */
export const DENSIDAD_MEZCLA_DEFAULT = 0.6;

export type UnidadTacho = "kg" | "L";

export interface ResultadoTachos {
  /** Kg de mezcla que entran en un tacho. */
  kgPorTacho: number;
  /** Tachos a llenar (redondeado para arriba). */
  tachosNecesarios: number;
  /** Tachos sin redondear (ej. 6,87). */
  tachosExactos: number;
  /** Kg que van en el ultimo tacho (igual a kgPorTacho si la division es exacta). */
  kgUltimoTacho: number;
}

function positivo(v: number) {
  return Number.isFinite(v) && v > 0;
}

/**
 * Kg de mezcla por tacho: la capacidad si es en kg, o capacidad × densidad si
 * es en litros. Devuelve null si algun dato no es valido.
 */
export function kgPorTacho(
  capacidad: number,
  unidad: UnidadTacho,
  densidadKgL: number,
): number | null {
  if (!positivo(capacidad)) return null;
  if (unidad === "kg") return capacidad;
  if (!positivo(densidadKgL)) return null;
  return capacidad * densidadKgL;
}

/** Cuantos tachos hacen falta para `totalKg` de mezcla. Null si algun dato no es valido. */
export function calcularTachos(
  totalKg: number,
  capacidad: number,
  unidad: UnidadTacho,
  densidadKgL: number,
): ResultadoTachos | null {
  if (!positivo(totalKg)) return null;
  const porTacho = kgPorTacho(capacidad, unidad, densidadKgL);
  if (porTacho == null) return null;
  // Se redondea antes del ceil para que 30 / 10 no de 3,0000000001 → 4.
  const tachosExactos = Number((totalKg / porTacho).toFixed(6));
  const tachosNecesarios = Math.ceil(tachosExactos);
  const kgUltimoTacho = totalKg - (tachosNecesarios - 1) * porTacho;
  return { kgPorTacho: porTacho, tachosNecesarios, tachosExactos, kgUltimoTacho };
}
