import * as React from 'react';

export interface DrawerProps {
  open: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Bajo la descripción, p. ej. "Se va a crear <Tag tone="outline">ENK-L-2026-001-R04</Tag>". */
  meta?: React.ReactNode;
  onClose?: () => void;
  footer?: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  width?: number | string;
  children?: React.ReactNode;
}
export declare function Drawer(props: DrawerProps): JSX.Element | null;
