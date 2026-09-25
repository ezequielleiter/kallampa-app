// Tipos y constantes del monitoreo (compartidos cliente/servidor: sin
// dependencias de Node ni de mongoose).

export const RANGOS = ["1h", "2h", "6h", "24h", "7d"] as const;
export type Rango = (typeof RANGOS)[number];

export const TIPOS_SERIE = ["calefaccion", "humedad"] as const;
export type TipoSerie = (typeof TIPOS_SERIE)[number];

/** Duracion de cada rango, en segundos. */
export const RANGO_SEG: Record<Rango, number> = {
  "1h": 3600,
  "2h": 7200,
  "6h": 6 * 3600,
  "24h": 24 * 3600,
  "7d": 7 * 24 * 3600,
};

/** Ventana de agregacion por defecto de cada rango (antes de ajustar al muestreo). */
export const VENTANA_SEG: Record<Rango, number> = {
  "1h": 60,
  "2h": 60,
  "6h": 60,
  "24h": 5 * 60,
  "7d": 30 * 60,
};

/** Una ventana agregada: promedio del valor y segundos que el actuador estuvo prendido. */
export interface SerieRow {
  /** Inicio de la ventana, epoch en ms (UTC). */
  t: number;
  /** Temperatura (°C) o humedad (%) promedio; null si fallo el sensor. */
  valor: number | null;
  /** Segundos prendido dentro de la ventana. */
  onSeg: number;
}

export interface SerieResponse {
  rows: SerieRow[];
  windowSec: number;
  range: Rango;
  /** Epoch ms del inicio y fin del eje X (ahora − rango → ahora). */
  desde: number;
  hasta: number;
}

export interface EquipoInflux {
  id: string;
  device: string | null;
}

export const INFLUX_ID_RE = /^[0-9a-f]{6}$/;
