import * as React from 'react';

export interface TableColumn<R = any> {
  key: string;
  label: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
  /** Cifras tabulares (códigos, pesos, fechas). */
  numeric?: boolean;
  /** Evita cortes en códigos como ENK-L-2026-001. */
  nowrap?: boolean;
  render?: (row: R, index: number) => React.ReactNode;
}
export interface TableProps<R = any> {
  columns: TableColumn<R>[];
  rows: R[];
  rowKey?: (row: R, index: number) => React.Key;
  /** Filas clicables (navegar al detalle). */
  onRowClick?: (row: R, index: number) => void;
  /** Ancho mínimo antes de scroll horizontal. */
  minWidth?: number;
  empty?: React.ReactNode;
  /** Filas extra al final (p. ej. Total). */
  footer?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Table<R = any>(props: TableProps<R>): JSX.Element;
