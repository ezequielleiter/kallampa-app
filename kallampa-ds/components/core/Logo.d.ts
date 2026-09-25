import * as React from 'react';

export interface LogoProps {
  /** Alto del símbolo en px. */
  size?: number;
  /** Muestra "kallampa" junto al símbolo. */
  wordmark?: boolean;
  /** Animación de entrada: el micelio crece y luego aparece el sombrero (una vez). */
  animated?: boolean;
  style?: React.CSSProperties;
}
export declare function Logo(props: LogoProps): JSX.Element;
