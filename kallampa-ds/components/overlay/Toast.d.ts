import * as React from 'react';

export interface ToastProps {
  /** Texto de confirmación; null/'' oculta. */
  message?: string | null;
  icon?: string;
  duration?: number;
  onDone?: () => void;
}
export declare function Toast(props: ToastProps): JSX.Element | null;
