import * as React from 'react';

export interface ChoiceItem { value: string; label: React.ReactNode; meta?: React.ReactNode; status?: string; note?: React.ReactNode; disabled?: boolean; }
export interface ChoiceListProps {
  /** radio = una opción · checkbox = varias */
  type?: 'radio' | 'checkbox';
  name: string;
  items: ChoiceItem[];
  /** string (radio) o string[] (checkbox) */
  value?: string | string[];
  onChange?: (value: any) => void;
  invalid?: boolean;
  style?: React.CSSProperties;
}
export declare function ChoiceList(props: ChoiceListProps): JSX.Element;
