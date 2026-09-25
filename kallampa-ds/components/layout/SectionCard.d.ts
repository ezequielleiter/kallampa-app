import * as React from 'react';

export interface SectionCardProps {
  /** "01", "02"… en acento, para etapas. */
  number?: string;
  title: React.ReactNode;
  /** Resumen de una línea: "Arroz · 10 kg · $600/kg · 5 frascos". */
  meta?: React.ReactNode;
  /** Contenido a la derecha del título (contadores de estado). */
  aside?: React.ReactNode;
  /** Botones de la sección. */
  actions?: React.ReactNode;
  highlight?: boolean;
  children?: React.ReactNode;
}
export declare function SectionCard(props: SectionCardProps): JSX.Element;
