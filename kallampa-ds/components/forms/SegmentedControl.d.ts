import * as React from 'react';

export interface SegmentOption { value: string; label: React.ReactNode; icon?: string; count?: number; }
export interface SegmentedControlProps {
  name: string;
  options: SegmentOption[];
  value: string;
  onChange?: (value: string) => void;
  /** Ocupa el ancho disponible, opciones repartidas. */
  block?: boolean;
  style?: React.CSSProperties;
}
export declare function SegmentedControl(props: SegmentedControlProps): JSX.Element;
