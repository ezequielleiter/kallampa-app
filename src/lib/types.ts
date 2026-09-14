// Tipos "de UI" que reflejan la forma JSON real devuelta por la API
// (ver src/app/api/**). No importan nada de `@/models` a proposito: son
// solo `interface`/`type` (se borran en compilacion) para que cualquier
// Client Component los pueda usar sin riesgo de arrastrar mongoose.
import type { EstadoDerivado, JarEstado, RecipienteEstado } from "@/lib/constants";
import type { AgregadoCatalogo, ResumenLote } from "@/lib/metrics";

// v2: 3 campos (antes 4, se elimina "cosecha"; "crecimientoSustrato" pasa a
// llamarse "incubacion" porque ahora describe la etapa de los recipientes).
export interface DiasEsperadosDefault {
  inoculacionGrano: number;
  incubacion: number;
  fructificacion: number;
}

export interface FungusType {
  _id: string;
  nombre: string;
  nombreCientifico?: string;
  notas?: string;
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
