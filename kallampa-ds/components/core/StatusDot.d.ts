import * as React from 'react';

export interface StatusDotProps {
  status: string;
  /** Diámetro en px (8 por defecto). */
  size?: number;
  style?: React.CSSProperties;
}
export declare function StatusDot(props: StatusDotProps): JSX.Element;
