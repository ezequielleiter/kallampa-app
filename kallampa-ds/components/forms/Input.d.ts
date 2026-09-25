import * as React from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  /** Texto fijo a la izquierda, p. ej. "$" o "@". */
  prefix?: React.ReactNode;
  /** Unidad a la derecha, p. ej. "kg", "ml". */
  suffix?: React.ReactNode;
  /** Borde de error. */
  invalid?: boolean;
}
export declare function Input(props: InputProps): JSX.Element;
