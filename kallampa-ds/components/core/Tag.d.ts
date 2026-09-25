import * as React from 'react';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** accent = activo/listo · neutral = terminado · outline = en progreso · danger = contaminado */
  tone?: 'accent' | 'neutral' | 'outline' | 'danger';
  /** Tachado (descartado). */
  strike?: boolean;
}
export declare function Tag(props: TagProps): JSX.Element;
