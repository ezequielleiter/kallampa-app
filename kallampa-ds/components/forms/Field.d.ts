import * as React from 'react';

export interface FieldProps {
  label?: React.ReactNode;
  htmlFor?: string;
  /** Ayuda bajo el control (se oculta si hay error). */
  hint?: React.ReactNode;
  /** Mensaje de error: qué pasó y cómo resolverlo. */
  error?: React.ReactNode;
  /** Agrega "(opcional)" al label. */
  optional?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Field(props: FieldProps): JSX.Element;
