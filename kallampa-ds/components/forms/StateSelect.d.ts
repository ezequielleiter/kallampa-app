import * as React from 'react';

export interface StateSelectProps {
  value: string;
  /** Estados permitidos, p. ej. ['Colonizando','Colonizado','Contaminado','Usado'] */
  options: string[];
  onChange?: (value: string) => void;
  /** aria-label del select. */
  label?: string;
  width?: number;
}
export declare function StateSelect(props: StateSelectProps): JSX.Element;
