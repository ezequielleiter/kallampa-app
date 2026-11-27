import "server-only";
import type { ArteFigura } from "../tipos";
import { ADELANTE, ATRAS, HEIGHT, RESPALDO, ROTOR, WIDTH } from "./geometry";

export const ARTE_FRUCTIFICACION: ArteFigura = {
  width: WIDTH,
  height: HEIGHT,
  atras: ATRAS,
  adelante: ADELANTE,
  respaldo: RESPALDO,
  rotor: ROTOR,
};
