import * as React from 'react';

export interface CostItem { name: string; value: number; }
export interface CostBreakdownProps {
  items: CostItem[];
  title?: string;
  /** Formateador de moneda (por defecto "$ 9.160", es-AR). */
  format?: (n: number) => string;
  onAdd?: () => void;
}
export declare function CostBreakdown(props: CostBreakdownProps): JSX.Element;
