import * as React from 'react';

export interface SelectOption { value: string; label: string; disabled?: boolean; }
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<string | SelectOption>;
  /** Opción vacía inicial, p. ej. "Elegí un hongo". */
  placeholder?: string;
  invalid?: boolean;
}
export declare function Select(props: SelectProps): JSX.Element;
