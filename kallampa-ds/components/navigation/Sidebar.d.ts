import * as React from 'react';

export interface NavItem { label: string; icon: string; active?: boolean; href?: string; onClick?: () => void; }
export interface SidebarProps {
  items: NavItem[];
  /** Nombre de usuario (inicial como avatar). */
  user?: string;
  /** Enlaces al pie: Configuraciones, Cerrar sesión. */
  footer?: React.ReactNode;
  onBrandClick?: () => void;
}
export declare function Sidebar(props: SidebarProps): JSX.Element;
