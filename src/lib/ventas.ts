// Logica pura de ventas / stock de producto (sin Mongo, testeable).

import type { ResumenComercialLote } from "@/lib/types";

/** Tolerancia para comparar kg pedidos contra kg disponibles (ruido de float). */
export const EPSILON_KG = 1e-6;

/** Redondea a 3 decimales (gramos) para que no quede ruido de float (0.30000000000000004). */
export function redondearKg(v: number): number {
  return Math.round(v * 1000) / 1000 + 0; // + 0 => sin -0
}

/** Redondea a centavos. */
function redondearPlata(v: number): number {
  return Math.round(v * 100) / 100 + 0;
}

/** Total de una venta = Σ kg × precioPorKg. */
export function totalVenta(items: { kg: number; precioPorKg: number }[]): number {
  return redondearPlata(items.reduce((acc, i) => acc + (i.kg || 0) * (i.precioPorKg || 0), 0));
}

export interface StockInput {
  cosechadoKg: number;
  vendidoKg: number;
  mermaKg: number;
}

/** Stock de un lote: cosechado − vendido − merma. */
export function stockLote(input: StockInput): StockInput & { disponibleKg: number } {
  const cosechadoKg = redondearKg(input.cosechadoKg);
  const vendidoKg = redondearKg(input.vendidoKg);
  const mermaKg = redondearKg(input.mermaKg);
  return {
    cosechadoKg,
    vendidoKg,
    mermaKg,
    disponibleKg: redondearKg(cosechadoKg - vendidoKg - mermaKg),
  };
}

/**
 * Resumen comercial de un lote. `costoTotal` es el de resumenLote()
 * (grano + sustrato), asi que el margen solo descuenta ese costo.
 */
export function resumenComercialLote(
  input: StockInput & { ingresos: number; costoTotal: number }
): ResumenComercialLote {
  const stock = stockLote(input);
  const ingresos = redondearPlata(input.ingresos);
  return {
    ...stock,
    ingresos,
    margen: redondearPlata(ingresos - (input.costoTotal || 0)),
    precioPromedioKg: stock.vendidoKg > 0 ? ingresos / stock.vendidoKg : null,
  };
}

/** "3,25" — kg en formato es-AR con hasta 2 decimales (para mensajes de error). */
export function formatKgEsAR(kg: number): string {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(kg);
}
