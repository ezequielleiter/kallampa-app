import type { SerieRow } from "./tipos";

// Consumo electrico estimado del calefactor: tiempo prendido (segun Influx)
// × potencia nominal. Es un estimado: supone que el calefactor tira toda su
// potencia mientras esta prendido.

/** kWh consumidos por un calefactor de `kw` kW prendido `onSeg` segundos. */
export function consumoKwh(onSeg: number, kw: number): number {
  return (onSeg / 3600) * kw;
}

export interface ResumenConsumo {
  /** Segundos prendido en todo el rango. */
  prendidaSeg: number;
  /** null si no hay potencia cargada. */
  kwh: number | null;
  /** null si falta la potencia o el precio del kWh. */
  costo: number | null;
}

export function resumenConsumo(
  rows: SerieRow[],
  kw?: number | null,
  precioKwh?: number | null
): ResumenConsumo {
  const prendidaSeg = rows.reduce((a, r) => a + r.onSeg, 0);
  const kwh = kw != null && kw > 0 ? consumoKwh(prendidaSeg, kw) : null;
  const costo = kwh != null && precioKwh != null && precioKwh > 0 ? kwh * precioKwh : null;
  return { prendidaSeg, kwh, costo };
}
