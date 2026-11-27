import "server-only";
import { ADELANTE, ATRAS, HEIGHT, ROTOR, WIDTH } from "./geometry";

/** Arte estatico de la figura, armado en el servidor (la geometria y el kit no viajan al navegador). */
export interface ArteFigura {
  width: number;
  height: number;
  atras: string;
  adelante: string;
  /** Cuadros del rotor de la turbina (un paso de pala). */
  rotor: string[];
}

export const ARTE_FRUCTIFICACION: ArteFigura = { width: WIDTH, height: HEIGHT, atras: ATRAS, adelante: ADELANTE, rotor: ROTOR };
