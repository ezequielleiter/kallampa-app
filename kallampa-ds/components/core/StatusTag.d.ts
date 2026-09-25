import * as React from 'react';

export type KallampaStatus = 'Colonizando' | 'Colonizado' | 'Contaminado' | 'Usado' | 'Incubando' | 'Fructificando' | 'Finalizado' | 'Finalizada' | 'Descartado' | 'Cosechado' | 'En desarrollo' | 'Listo' | 'En curso' | 'Activa';
export interface StatusTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: KallampaStatus;
  /** Texto alternativo; por defecto el nombre del estado. */
  children?: React.ReactNode;
}
export declare function StatusTag(props: StatusTagProps): JSX.Element;
