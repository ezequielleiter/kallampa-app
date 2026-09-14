// Copias "de UI" de los enums definidos en los modelos de Mongoose.
//
// IMPORTANTE: nunca importes valores runtime desde `@/models/*` en un Client
// Component (arrastraria `mongoose` al bundle del navegador). Estos arrays
// son un espejo exacto de BATCH_ESTADOS / JAR_ESTADOS definidos en
// src/models/Batch.ts y src/models/Jar.ts.

export const BATCH_ESTADOS = [
  "inoculacion_grano",
  "crecimiento_sustrato",
  "fructificacion",
  "cosecha",
  "finalizado",
  "descartado",
] as const;

export type BatchEstado = (typeof BATCH_ESTADOS)[number];

export const JAR_ESTADOS = [
  "colonizando",
  "colonizado",
  "contaminado",
  "usado",
] as const;

export type JarEstado = (typeof JAR_ESTADOS)[number];

export const BATCH_ESTADO_LABELS: Record<BatchEstado, string> = {
  inoculacion_grano: "Inoculación en grano",
  crecimiento_sustrato: "Crecimiento en sustrato",
  fructificacion: "Fructificación",
  cosecha: "Cosecha",
  finalizado: "Finalizado",
  descartado: "Descartado",
};

export const JAR_ESTADO_LABELS: Record<JarEstado, string> = {
  colonizando: "Colonizando",
  colonizado: "Colonizado",
  contaminado: "Contaminado",
  usado: "Usado",
};

// Etapas del kanban, en orden. `descartado` queda afuera: se muestra en una
// seccion aparte, no como columna.
export const KANBAN_ESTADOS: BatchEstado[] = [
  "inoculacion_grano",
  "crecimiento_sustrato",
  "fructificacion",
  "cosecha",
  "finalizado",
];

// Paleta categorica (ver skill de dataviz): un color fijo por estado, usado
// consistentemente en badges, columnas del kanban y el grafico de
// distribucion por estado en Estadisticas.
export const BATCH_ESTADO_COLORS: Record<BatchEstado, string> = {
  inoculacion_grano: "#0c5cfc", // azul
  crecimiento_sustrato: "#fc7100", // naranja
  fructificacion: "#0a4bcc", // azul oscuro
  cosecha: "#fc8d32", // naranja claro
  finalizado: "#3a4152", // ink (asentado/terminado)
  descartado: "#8b93a4", // gris claro (fuera de la paleta categorica activa)
};

export const JAR_ESTADO_BADGE_VARIANT: Record<
  JarEstado,
  "default" | "secondary" | "destructive" | "outline"
> = {
  colonizando: "secondary",
  colonizado: "default",
  contaminado: "destructive",
  usado: "outline",
};

// Colores de estado "fijos" (nunca reutilizados para series), para alertas.
// Escala de severidad dentro de una sola familia de tono (naranja), en vez
// de un semaforo rojo/amarillo/verde: el sistema de origen evita introducir
// tonalidades nuevas a proposito.
export const STATUS_COLORS = {
  good: "#0c5cfc",
  warning: "#fc8d32",
  serious: "#fc7100",
  critical: "#d15e00",
};

// Paleta categorica general para graficos de una sola serie por categoria.
export const CHART_PALETTE = ["#0c5cfc", "#fc7100", "#5b6376", "#0a4bcc", "#d15e00"];
