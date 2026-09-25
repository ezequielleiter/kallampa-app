import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: number | string;
  /** Borde de acento (próximo paso, pendientes). */
  highlight?: boolean;
  /** Superficie hundida dentro de otra card (bloques de cosecha, resúmenes). */
  inset?: boolean;
}
export declare function Card(props: CardProps): JSX.Element;
