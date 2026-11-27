/** Arte estatico de una figura, armado en el servidor (la geometria y el kit no viajan al navegador). */
export interface ArteFigura {
  width: number;
  height: number;
  atras: string;
  adelante: string;
  /** Volutas SVG para cuando no hay WebGL (van al final de `atras`). */
  respaldo: string;
  /** Cuadros del rotor de la turbina (un paso de pala). */
  rotor: string[];
}
