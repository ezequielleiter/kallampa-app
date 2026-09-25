import * as React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Ícono Phosphor sin prefijo. */
  icon: string;
  /** Texto accesible (aria-label y tooltip). Obligatorio. */
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Lado en px. 28 en filas de tabla, 36 en barras. */
  size?: number;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
