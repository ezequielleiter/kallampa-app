import type { Invernadero } from "@/lib/types";

type Medidas = Pick<Invernadero, "altoM" | "largoM" | "profundidadM">;

/** Superficie de piso (largo × profundidad), en m². */
export function superficieM2(i: Medidas): number {
  return i.largoM * i.profundidadM;
}

/** Volumen interior (alto × largo × profundidad), en m³. */
export function volumenM3(i: Medidas): number {
  return i.altoM * i.largoM * i.profundidadM;
}

/**
 * Parsea lo que se tipea en un campo de medida: acepta coma o punto decimal
 * ("2,5" o "2.5"). Vacio → undefined, para que la validacion lo marque.
 */
export function parseMedida(v: unknown): number | undefined {
  if (v === "" || v == null) return undefined;
  const n = Number(String(v).trim().replace(",", "."));
  return Number.isNaN(n) ? Number.NaN : n;
}
