// Copias "de UI" de los enums definidos en los modelos de Mongoose.
//
// IMPORTANTE: nunca importes valores runtime desde `@/models/*` en un Client
// Component (arrastraria `mongoose` al bundle del navegador). Estos arrays
// son un espejo exacto de los enums definidos en src/models/*.ts.

// --- Lote (v2: sin estado persistido, se deriva de sus frascos/recipientes) --

export const ESTADO_DERIVADO = ["en_progreso", "finalizado"] as const;
export type EstadoDerivado = (typeof ESTADO_DERIVADO)[number];

// Colores del DS Kallampa (kallampa-ds/tokens): acento violeta para lo
// activo, neutros para lo terminado y coral SOLO para contaminacion/perdida.
// Son literales (no `var(--…)`) porque Recharts los usa en SVG y en calculos.
export const ESTADO_DERIVADO_COLORS: Record<EstadoDerivado, string> = {
  en_progreso: "#9184d9", // acento
  finalizado: "#75798c", // neutral-600 (terminado)
};


// --- Frasco (Jar) — sin cambios respecto a v1 ---------------------------

export const JAR_ESTADOS = [
  "colonizando",
  "colonizado",
  "contaminado",
  "usado",
] as const;

export type JarEstado = (typeof JAR_ESTADOS)[number];


// --- Placa (Clonación, entidad nueva) ------------------------------------

export const PLACA_ESTADOS = ["colonizando", "colonizado", "contaminado"] as const;

export type PlacaEstado = (typeof PLACA_ESTADOS)[number];


// --- Frasco de micelio líquido (Clonación, entidad nueva) ----------------

export const FRASCO_LIQUIDO_ESTADOS = ["colonizando", "colonizado", "vacio", "finalizado", "contaminado"] as const;

export type FrascoLiquidoEstado = (typeof FRASCO_LIQUIDO_ESTADOS)[number];


// --- Recipiente (v2, entidad nueva) --------------------------------------

export const RECIPIENTE_ESTADOS = [
  "incubando",
  "fructificando",
  "finalizado",
  "contaminado",
  "descartado",
] as const;

export type RecipienteEstado = (typeof RECIPIENTE_ESTADOS)[number];

// Un color fijo por estado, consistente en tags y graficos.
export const RECIPIENTE_ESTADO_COLORS: Record<RecipienteEstado, string> = {
  incubando: "#5d5294", // accent-700 (en progreso)
  fructificando: "#9184d9", // acento (activo)
  finalizado: "#75798c", // neutral-600 (terminado)
  contaminado: "#d9705a", // coral (perdida)
  descartado: "#3f424d", // neutral-800 (descartado)
};


// Estados terminales: no admiten mas transiciones (bloqueado por el backend).
export const RECIPIENTE_ESTADOS_TERMINALES: RecipienteEstado[] = [
  "finalizado",
  "contaminado",
  "descartado",
];

// Colores de estado "fijos" (nunca reutilizados para series), para alertas.
// Escala de severidad: acento para lo normal y coral (unico color fuera de la
// paleta mono) con distinta intensidad para lo que requiere atencion.
export const STATUS_COLORS = {
  good: "#9184d9",
  warning: "#e8a594",
  serious: "#d9705a",
  critical: "#c4543f",
};

// Paleta categorica general para graficos de una sola serie por categoria.
// Rampa de acento + neutros (el DS es mono-acento: el contraste sale del tono).
export const CHART_PALETTE = ["#9184d9", "#5d5294", "#b2b6ca", "#d2cefd", "#75798c"];

// --- Tarea (Calendario, entidad nueva) ------------------------------------

export const TAREA_ESTADOS = ["pendiente", "hecha"] as const;
export type TareaEstado = (typeof TAREA_ESTADOS)[number];

// --- Pills automaticos del Calendario (grano/incubacion/fructificacion/placas) --

export type LotePillTipo = "grano" | "incubacion" | "fructificacion" | "placas";

export const LOTE_PILL_COLORS: Record<LotePillTipo, string> = {
  grano: "#5d5294",
  incubacion: "#796cbf",
  fructificacion: "#9184d9",
  placas: "#75798c",
};
