import * as React from 'react';

export interface DialogProps {
  open: boolean;
  title: React.ReactNode;
  /** Etiqueta junto al título, p. ej. <Tag tone="accent">2ª oleada</Tag>. */
  badge?: React.ReactNode;
  /** Contexto: "ENK-L-2026-001-R02 · Paja de trigo · 3,00 kg". */
  subtitle?: React.ReactNode;
  onClose?: () => void;
  /** Botones al pie (Cancelar + acción). */
  footer?: React.ReactNode;
  /** Si se pasa, el cuerpo es un <form noValidate>. */
  onSubmit?: (e: React.FormEvent) => void;
  width?: number;
  children?: React.ReactNode;
}
export declare function Dialog(props: DialogProps): JSX.Element | null;
