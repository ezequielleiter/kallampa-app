// Tipos "de UI" que reflejan la forma JSON real devuelta por la API
// (ver src/app/api/**). No importan nada de `@/models` a proposito: son
// solo `interface`/`type` (se borran en compilacion) para que cualquier
// Client Component los pueda usar sin riesgo de arrastrar mongoose.
import type {
  EstadoDerivado,
  JarEstado,
  RecipienteEstado,
  PlacaEstado,
  FrascoLiquidoEstado,
  TareaEstado,
  LotePillTipo,
} from "@/lib/constants";
import type { AgregadoCatalogo, ResumenLote, ResumenClonacion } from "@/lib/metrics";

// v2: 3 campos (antes 4, se elimina "cosecha"; "crecimientoSustrato" pasa a
// llamarse "incubacion" porque ahora describe la etapa de los recipientes).
// v2.1 (Clonación): se agrega un 4° campo opcional — opcional porque los
// hongos ya creados en la base real no lo tienen todavía y no queremos
// forzar una migración.
export interface DiasEsperadosDefault {
  inoculacionGrano: number;
  incubacion: number;
  fructificacion: number;
  colonizacionPlacas?: number;
}

export interface FungusType {
  _id: string;
  nombre: string;
  nombreCientifico?: string;
  notas?: string;
  iniciales?: string;
  activo: boolean;
  diasEsperadosDefault: DiasEsperadosDefault;
  createdAt?: string;
  updatedAt?: string;
}

export interface GrainType {
  _id: string;
  nombre: string;
  notas?: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubstrateType {
  _id: string;
  nombre: string;
  notas?: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Dispositivo de monitoreo (microcontrolador) asociado a un invernadero. La
// app no se comunica con el: `dominio` (host de la red local, sin
// protocolo) se usa solo para abrir su pagina como `http://{dominio}`.
export interface Dispositivo {
  _id: string;
  nombre: string;
  dominio: string;
  createdAt?: string;
  updatedAt?: string;
}

// Invernadero (carpa/sala). Medidas en metros; superficie (largo ×
// profundidad) y volumen se calculan en el cliente.
export interface Invernadero {
  _id: string;
  nombre: string;
  altoM: number;
  largoM: number;
  profundidadM: number;
  notas?: string;
  activo: boolean;
  dispositivos: Dispositivo[];
  createdAt?: string;
  updatedAt?: string;
}

// Sin cambios de forma respecto a v1.
export interface Jar {
  _id: string;
  batchId: string;
  numeroGuia: string;
  estado: JarEstado;
  createdAt?: string;
  updatedAt?: string;
}

export interface JarSearchResult extends Jar {
  batch: {
    _id: string;
    numeroLote: string;
    fungusTypeId: FungusType;
  } | null;
}

export interface InoculacionGrano {
  tipoGranoId: GrainType | string;
  pesoGranoKg: number;
  precioPorKg: number;
  cantidadFrascos: number;
  fechaInicio: string;
  diasEsperados: number;
}

// v2: entidad NUEVA. Un lote se reparte en varios recipientes, cada uno con
// su propia incubacion/fructificacion/cosecha y su propio estado — a
// diferencia de v1, donde esto vivia como subdocumentos unicos del batch.
export interface Oleada {
  _id: string;
  fecha: string;
  pesoKg: number;
  notas?: string;
}

// En la lista embebida del detalle de lote, `origenFrascoIds` viene poblado
// (liviano: solo _id + numeroGuia). En otros contextos puede venir sin
// poblar (array de ids). El helper `getOrigenFrascoLabel` en
// `src/lib/recipiente-utils.ts` normaliza ambos casos.
export interface Recipiente {
  _id: string;
  batchId: string;
  numeroSeguimiento: string;
  origenFrascoIds: string[] | { _id: string; numeroGuia: string }[];
  tipoSustratoId: SubstrateType | string;
  pesoSustratoKg: number;
  precioPorKg: number;
  fechaInicioIncubacion: string;
  diasEsperadosIncubacion: number;
  fechaInicioFructificacion?: string;
  diasEsperadosFructificacion?: number;
  estado: RecipienteEstado;
  motivoPerdida?: string;
  oleadas: Oleada[];
  createdAt?: string;
  updatedAt?: string;
}

// v2: el batch ya no tiene `estado`/`descartado`/`motivoDescarte` ni los
// subdocumentos de etapa (crecimientoSustrato, fructificacion, cosecha,
// oleadas, historialEstados) — esos datos ahora viven en cada Recipiente.
export interface Batch {
  _id: string;
  numeroLote: string;
  fungusTypeId: FungusType;
  // Si el lote se inicio eligiendo un frasco de micelio liquido de
  // Clonacion (en vez de un tipo de hongo directamente), viene poblado
  // liviano (solo numeroGuia) para trazabilidad.
  origenFrascoLiquidoId?: { _id: string; numeroGuia: string } | string;
  inoculacionGrano: InoculacionGrano;
  createdAt?: string;
  updatedAt?: string;
}

// GET /api/batches/[id] → batch poblado + sus frascos y recipientes.
export interface BatchDetail extends Batch {
  jars: Jar[];
  recipientes: Recipiente[];
}

// --- /api/batches (lista) -------------------------------------------------

export interface BatchListItem {
  _id: string;
  numeroLote: string;
  fungusTypeId: FungusType;
  origenFrascoLiquidoId?: { _id: string; numeroGuia: string } | string;
  inoculacionGrano: InoculacionGrano;
  estadoDerivado: EstadoDerivado;
  alertas: number;
}

// --- /api/stats ---------------------------------------------------------

export interface StatsKpis {
  totalLotes: number;
  lotesActivos: number;
  lotesFinalizados: number;
  lotesDescartados: number;
  lotesDemorados: number;
  pesoTotalProducidoKg: number;
  eficienciaBiologicaPromedio: number | null;
  costoPorKgPromedio: number | null;
}

export interface StatsLote {
  _id: string;
  numeroLote: string;
  fungusTypeId: FungusType;
  resumen: ResumenLote;
}

export interface StatsLoteDemorado {
  numeroLote: string;
  diasDeDemora: number;
}

export interface StatsResponse {
  kpis: StatsKpis;
  lotes: StatsLote[];
  distribucionPorEstado: { label: string; value: number }[];
  agregados: {
    porHongo: AgregadoCatalogo[];
    porGrano: AgregadoCatalogo[];
    porSustrato: AgregadoCatalogo[];
  };
  lotesDemorados: StatsLoteDemorado[];
}

// --- Clonación (módulo nuevo, paralelo a Producción) ---------------------
//
// Flujo: se colonizan N placas de Petri a partir de una cepa (evento
// "colonización"); cada placa colonizada puede usarse para crear uno o más
// frascos de micelio líquido (no se consume al usarla). Esos frascos
// líquidos, junto con los frascos de grano de Producción, son los posibles
// orígenes de un Recipiente nuevo.

export interface Colonizacion {
  cantidadPlacas: number;
  fechaInicio: string;
  diasEsperados: number;
}

// Trazabilidad inversa a Batch.origenFrascoLiquidoId: una clonación se
// puede iniciar eligiendo el hongo directamente, O a partir de un Jar ya
// colonizado/usado, O de un Recipiente fructificando. Opcionales: la
// mayoría de las clonaciones no tienen origen.
export interface Clonacion {
  _id: string;
  numeroLote: string; // "C-2026-001"
  fungusTypeId: FungusType; // poblado
  origenProceso: "placa" | "comprado" | "frascoGrano";
  fechaInicio: string;
  cantidadFrascos?: number;
  // Solo presente cuando `origenProceso === "placa"`.
  colonizacion?: Colonizacion;
  origenTipo?: "jar" | "recipiente";
  origenBatchId?: string | { _id: string; numeroLote: string };
  origenJarId?: string | { _id: string; numeroGuia: string };
  origenRecipienteId?: string | { _id: string; numeroSeguimiento: string };
  recetaAgar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClonacionResumen {
  placasColonizando: number;
  placasColonizado: number;
  placasContaminado: number;
  frascosLiquidosColonizando: number;
  frascosLiquidosColonizados: number;
  frascosLiquidosVacios: number;
  frascosLiquidosFinalizados: number;
  frascosLiquidosContaminados: number;
  alertas: number;
}

export interface ClonacionListItem extends Clonacion {
  resumen: ClonacionResumen;
}

export interface Placa {
  _id: string;
  clonacionId: string;
  numeroPlaca: string; // "C-2026-001-P01"
  estado: PlacaEstado;
  createdAt?: string;
  updatedAt?: string;
}

// `clonacionId`/`origenPlacaId` vienen sin poblar en el detalle de una
// clonación (ya sabemos de cuál se trata) y poblados livianamente en los
// listados globales cross-clonación (selector de Producción).
export interface FrascoLiquido {
  _id: string;
  clonacionId:
    | string
    | {
        _id: string;
        numeroLote: string;
        fungusTypeId?: FungusType;
      };
  origenPlacaId?: string | { _id: string; numeroPlaca: string };
  numeroGuia: string; // "C-2026-001-L01"
  fechaCreacion: string;
  estado: FrascoLiquidoEstado;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClonacionDetail extends Clonacion {
  placas: Placa[];
  frascosLiquidos: FrascoLiquido[];
}

// --- GET /api/jars/[id] y GET /api/recipientes/[id] -----------------------
// Frasco/recipiente + su lote y hongo poblados, usado para prellenar
// "nueva clonación" cuando se llega desde "Clonar este frasco/recipiente".

export interface JarDetail extends Jar {
  batch: { _id: string; numeroLote: string; fungusTypeId: FungusType };
}

export interface RecipienteDetail extends Recipiente {
  batch: { _id: string; numeroLote: string; fungusTypeId: FungusType };
}

// --- GET /api/trazabilidad -------------------------------------------------
// Material crudo para reconstruir en el cliente el árbol
// Lote -> Clonación -> Lote -> ...

export interface TrazabilidadLote {
  _id: string;
  numeroLote: string;
  fungusTypeId: { nombre: string };
  origenFrascoLiquidoId?: string;
  resumen: ResumenLote;
}

export interface TrazabilidadClonacion {
  _id: string;
  numeroLote: string;
  fungusTypeId: { nombre: string };
  origenTipo?: "jar" | "recipiente";
  origenBatchId?: string;
  origenJarId?: { numeroGuia: string };
  origenRecipienteId?: { numeroSeguimiento: string };
  resumen: ResumenClonacion;
}

export interface TrazabilidadResponse {
  lotes: TrazabilidadLote[];
  clonaciones: TrazabilidadClonacion[];
  frascosLiquidos: { _id: string; numeroGuia: string; clonacionId: string }[];
}

// --- Notas (wiki en Markdown, sin relación con el dominio de cultivo) ----

export interface NotaListItem {
  _id: string;
  titulo: string;
  updatedAt: string;
  extracto: string;
}

export interface Nota {
  _id: string;
  titulo: string;
  contenido: string; // Markdown crudo
  createdAt: string;
  updatedAt: string;
}

// --- Calendario (tareas manuales + pills automaticos de etapa) ----------

export interface Tarea {
  _id: string;
  titulo: string;
  descripcion?: string;
  fecha: string; // ISO
  estado: TareaEstado;
  createdAt?: string;
  updatedAt?: string;
}

// Pill "esta etapa deberia terminar en esta fecha", 100% calculado (nunca
// persistido) -- ver `lotePillsPendientes` en src/lib/metrics.ts.
export interface LotePill {
  tipo: LotePillTipo;
  fechaEsperada: string; // ISO
  codigo: string;
  href: string;
}

export interface CalendarioResponse {
  tareas: Tarea[];
  lotePills: LotePill[];
}
