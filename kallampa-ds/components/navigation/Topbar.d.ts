import * as React from 'react';

export interface Crumb { label: React.ReactNode; onClick?: () => void; }
export interface TopbarProps {
  /** Ruta: el último es la página actual. */
  crumbs: Crumb[];
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
  /** Escaneo de etiqueta/código de frasco. */
  onScan?: () => void;
  actions?: React.ReactNode;
}
export declare function Topbar(props: TopbarProps): JSX.Element;
