import * as React from 'react';

export interface KpiProps { label: React.ReactNode; value: React.ReactNode; note?: React.ReactNode; }
export declare function Kpi(props: KpiProps): JSX.Element;
export interface KpiGridProps { items: KpiProps[]; /** Ancho mínimo de columna. */ min?: number; style?: React.CSSProperties; }
export declare function KpiGrid(props: KpiGridProps): JSX.Element;
