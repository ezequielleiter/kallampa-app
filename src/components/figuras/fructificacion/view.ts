// Medidas del invernadero INV-2.1M-PVC (image.png) y de lo que tiene adentro, en cm.
// Ejes del dibujo: x de izquierda a derecha mirando de frente (0–143), y desde el
// fondo (0) hacia el frente (195), z hacia arriba. Con el azimut de 45° del kit la
// esquina adelante a la derecha queda mas cerca.
import { fitProjection } from "@/components/iso/iso-kit";

type P3 = [number, number, number];

export const WIDTH = 640;
export const HEIGHT = 600;

export const ANCHO = 143;
export const FONDO = 195;
/** Alero: estimado de la foto (los postes laterales llegan a ~70 % del alto). */
export const ALERO = 150;
export const CUMBRERA = 215;
export const MEDIO_X = ANCHO / 2;

/** Caño de la estructura Ø16 mm y conectores de las uniones. */
export const CANO = 0.8;
export const NUDO = 1.5;
/** Las uniones de abajo apoyan en el piso. */
export const PISO = NUDO;

/** Arcos (a lo largo de y), como en la foto. */
export const ARCOS = [0, 65, 130, 195];

/** Estanterias: 45 cm desde cada costado; el pasillo es x 45–98. */
export const ESTANTE_PROF = 45;
export const ESTANTES = {
  izquierda: { x0: 0, x1: ESTANTE_PROF, niveles: [48, 95] },
  derecha: { x0: ANCHO - ESTANTE_PROF, x1: ANCHO, niveles: [50, 80, 110] },
};
/** Malla de los estantes, 3,3 × 7,2 cm. */
export const MALLA: [number, number] = [3.3, 7.2];

/** Humidificador en el piso, adelante a la izquierda (en el pasillo). */
export const HUMIDIFICADOR = { x: 47, y: 155, w: 30, d: 30, r: 4, alto: 32, tapa: 3 };
/** Caño de PVC Ø4: sube desde la boquilla junto al estante izquierdo (para sujetarlo a su riel). */
export const CANO_PVC = { x: 54, y: 170, r: 2, desde: HUMIDIFICADOR.alto + HUMIDIFICADOR.tapa + 3, hasta: 113 };
/** Codo de PVC: sale hacia el fondo (−y) a 1,2 m. */
export const CODO = { r: 2.7, z: 120, curva: 4.5, boca: [54, 160, 120] as P3 };

/** Turbina en linea de 4" (100 mm) abajo a la derecha, contra la pared del fondo. */
export const TURBINA = {
  x: 115,
  z: 14,
  /** Boca de entrada (mira al frente, +y). */
  boca: 46,
  radio: 10,
  collarin: 5,
  /** Fin del collarin de salida (hacia el fondo). */
  salida: 8,
  /** Boca del conducto, afuera del plastico del fondo. */
  afuera: -15,
};
export const BOCA_TURBINA: P3 = [TURBINA.x, TURBINA.boca, TURBINA.z];
export const BOCA_CONDUCTO: P3 = [TURBINA.x, TURBINA.afuera, TURBINA.z];

/** Sensor colgado de la cumbrera en el medio. */
export const SENSOR = { x: MEDIO_X, y: FONDO / 2, z0: 136, z1: 146, w: 6, d: 4 };

/** Piso donde apoya el invernadero. */
export const BASE = { x: -22, y: -42, w: ANCHO + 44, d: FONDO + 64, r: 6 };
export const BASE_ALTO = 5;

/** El plastico va por fuera de la estructura. */
export const PLASTICO = NUDO + 0.2;

export const P = fitProjection(
  [
    [BASE.x, BASE.y, -BASE_ALTO],
    [BASE.x + BASE.w, BASE.y, -BASE_ALTO],
    [BASE.x, BASE.y + BASE.d, -BASE_ALTO],
    [BASE.x + BASE.w, BASE.y + BASE.d, -BASE_ALTO],
    [MEDIO_X, 0, CUMBRERA + PLASTICO],
    [MEDIO_X, FONDO, CUMBRERA + PLASTICO],
  ],
  WIDTH,
  HEIGHT,
  { pad: 18 }
);
