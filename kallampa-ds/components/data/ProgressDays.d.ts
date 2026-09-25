import * as React from 'react';

export interface ProgressDaysProps {
  /** Días transcurridos. */
  value: number;
  /** Días esperados. */
  total: number;
  /** Estado de la unidad: tiñe la barra (danger si contaminado, neutro si terminado). */
  status?: string;
  width?: number;
}
export declare function ProgressDays(props: ProgressDaysProps): JSX.Element;
