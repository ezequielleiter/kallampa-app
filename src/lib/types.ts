// Tipos "de UI" que reflejan la forma JSON real devuelta por la API
// (ver src/app/api/**). No importan nada de `@/models` a proposito: son
// solo `interface`/`type` (se borran en compilacion) para que cualquier
// Client Component los pueda usar sin riesgo de arrastrar mongoose.
import type { BatchEstado, JarEstado } from "@/lib/constants";
import type { AgregadoCatalogo, ResumenLote } from "@/lib/metrics";

export interface DiasEsperadosDefault {
  inoculacionGrano: number;
  crecimientoSustrato: number;
  fructificacion: number;
  cosecha: number;
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
    estado: BatchEstado;
    fungusTypeId: FungusType;
  } | null;
}

export interface Recipiente {
  _id?: string;
  codigo: string;
  pesoKg: number;
  notas?: string;
}

export interface Oleada {
  _id: string;
  numero: number;
  fecha: string;
  pesoKg: number;
  notas?: string;
}

export interface HistorialEstado {
  estado: string;
  fecha: string;
}

export interface InoculacionGrano {
  tipoGranoId: GrainType | string;
  pesoGranoKg: number;
  precioPorKg: number;
  cantidadFrascos: number;
  fechaInicio: string;
  fechaFin?: string;
  diasEsperados: number;
}

export interface CrecimientoSustrato {
  tipoSustratoId?: SubstrateType | string;
  kilosSustrato?: number;
  precioPorKg?: number;
  fechaInicio?: string;
  fechaFin?: string;
  diasEsperados?: number;
}

export interface Fructificacion {
  fechaInicio?: string;
  fechaFin?: string;
  diasEsperados?: number;
  recipientes?: Recipiente[];
}

export interface Cosecha {
  fechaInicio?: string;
  fechaFin?: string;
  diasEsperados?: number;
}

export interface Batch {
  _id: string;
  numeroLote: string;
  fungusTypeId: FungusType;
  estado: BatchEstado;
  descartado: boolean;
  motivoDescarte?: string;
  inoculacionGrano: InoculacionGrano;
  crecimientoSustrato?: CrecimientoSustrato;
  fructificacion?: Fructificacion;
  cosecha?: Cosecha;
  oleadas: Oleada[];
  historialEstados: HistorialEstado[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BatchWithJars extends Batch {
  jars: Jar[];
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
  estado: BatchEstado;
  fungusTypeId: FungusType;
  resumen: ResumenLote;
}

export interface StatsLoteDemorado {
  numeroLote: string;
  estado: BatchEstado;
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
