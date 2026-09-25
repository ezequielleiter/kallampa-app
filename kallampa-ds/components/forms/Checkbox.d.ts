import * as React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  description?: React.ReactNode;
  /** Con borde, para opciones destacadas. */
  boxed?: boolean;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
