// Copias "de UI" de los enums definidos en los modelos de Mongoose.
//
// IMPORTANTE: nunca importes valores runtime desde `@/models/*` en un Client
// Component (arrastraria `mongoose` al bundle del navegador). Estos arrays
// son un espejo exacto de los enums definidos en src/models/*.ts.

// --- Lote (v2: sin estado persistido, se deriva de sus frascos/recipientes) --

export const ESTADO_DERIVADO = ["en_progreso", "finalizado"] as const;
export type EstadoDerivado = (typeof ESTADO_DERIVADO)[number];

export const ESTADO_DERIVADO_LABELS: Record<EstadoDerivado, string> = {
  en_progreso: "En progreso",
  finalizado: "Finalizado",
};

export const ESTADO_DERIVADO_COLORS: Record<EstadoDerivado, string> = {
  en_progreso: "#0c5cfc", // azul
  finalizado: "#3a4152", // ink (asentado/terminado)
};

export const ESTADO_DERIVADO_BADGE_VARIANT: Record<
  EstadoDerivado,
  "default" | "secondary" | "destructive" | "outline"
> = {
  en_progreso: "default",
  finalizado: "outline",
};

// --- Frasco (Jar) — sin cambios respecto a v1 ---------------------------

export const JAR_ESTADOS = [
  "colonizando",
  "colonizado",
  "contaminado",
  "usado",
] as const;

export type JarEstado = (typeof JAR_ESTADOS)[number];

export const JAR_ESTADO_LABELS: Record<JarEstado, string> = {
  colonizando: "Colonizando",
  colonizado: "Colonizado",
  contaminado: "Contaminado",
  usado: "Usado",
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

// --- Placa (Clonación, entidad nueva) ------------------------------------

export const PLACA_ESTADOS = ["colonizando", "colonizado", "contaminado"] as const;

export type PlacaEstado = (typeof PLACA_ESTADOS)[number];

export const PLACA_ESTADO_LABELS: Record<PlacaEstado, string> = {
  colonizando: "Colonizando",
  colonizado: "Colonizado",
  contaminado: "Contaminado",
};

export const PLACA_ESTADO_BADGE_VARIANT: Record<
  PlacaEstado,
  "default" | "secondary" | "destructive" | "outline"
> = {
  colonizando: "secondary",
  colonizado: "default",
  contaminado: "destructive",
};

// --- Frasco de micelio líquido (Clonación, entidad nueva) ----------------

export const FRASCO_LIQUIDO_ESTADOS = ["valido", "vacio", "finalizado", "contaminado"] as const;

export type FrascoLiquidoEstado = (typeof FRASCO_LIQUIDO_ESTADOS)[number];

export const FRASCO_LIQUIDO_ESTADO_LABELS: Record<FrascoLiquidoEstado, string> = {
  valido: "Válido",
  vacio: "Vacío",
  finalizado: "Finalizado",
  contaminado: "Contaminado",
};

export const FRASCO_LIQUIDO_ESTADO_BADGE_VARIANT: Record<
  FrascoLiquidoEstado,
  "default" | "secondary" | "destructive" | "outline"
> = {
  valido: "default",
  vacio: "outline",
  finalizado: "secondary",
  contaminado: "destructive",
};

// --- Recipiente (v2, entidad nueva) --------------------------------------

export const RECIPIENTE_ESTADOS = [
  "incubando",
  "fructificando",
  "finalizado",
  "contaminado",
  "descartado",
] as const;

export type RecipienteEstado = (typeof RECIPIENTE_ESTADOS)[number];

export const RECIPIENTE_ESTADO_LABELS: Record<RecipienteEstado, string> = {
  incubando: "Incubando",
  fructificando: "Fructificando",
  finalizado: "Finalizado",
  contaminado: "Contaminado",
  descartado: "Descartado",
};

// Misma paleta categorica usada en el resto de la app (ver skill de dataviz):
// un color fijo por estado, consistente en badges y graficos.
export const RECIPIENTE_ESTADO_COLORS: Record<RecipienteEstado, string> = {
  incubando: "#0c5cfc", // azul
  fructificando: "#fc7100", // naranja
  finalizado: "#3a4152", // ink (asentado/terminado)
  contaminado: "#d15e00", // naranja oscuro (perdida)
  descartado: "#8b93a4", // gris claro (fuera de la paleta categorica activa)
};

export const RECIPIENTE_ESTADO_BADGE_VARIANT: Record<
  RecipienteEstado,
  "default" | "secondary" | "destructive" | "outline"
> = {
  incubando: "secondary",
  fructificando: "default",
  finalizado: "outline",
  contaminado: "destructive",
  descartado: "destructive",
};

// Estados terminales: no admiten mas transiciones (bloqueado por el backend).
export const RECIPIENTE_ESTADOS_TERMINALES: RecipienteEstado[] = [
  "finalizado",
  "contaminado",
  "descartado",
];

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
