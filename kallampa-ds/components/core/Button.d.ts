import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = contorno de acento (acción principal). Nunca relleno. */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Nombre de ícono Phosphor sin prefijo, p. ej. "plus", "sign-in". */
  icon?: string;
  iconRight?: string;
  /** Muestra spinner y deshabilita. */
  loading?: boolean;
  /** Ancho completo, contenido centrado. */
  block?: boolean;
}
export declare function Button(props: ButtonProps): JSX.Element;
