import * as React from 'react';

export interface MenuItem { label: React.ReactNode; icon?: string; /** Acción destructiva: texto coral. */ danger?: boolean; onClick?: () => void; }
export interface MenuProps {
  open: boolean;
  items: MenuItem[];
  onClose?: () => void;
  align?: 'left' | 'right';
  minWidth?: number;
}
export declare function Menu(props: MenuProps): JSX.Element | null;
