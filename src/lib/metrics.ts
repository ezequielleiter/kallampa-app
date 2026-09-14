import { differenceInCalendarDays } from "date-fns";
import type { BatchEstado } from "@/models/Batch";

/**
 * Estas funciones operan sobre batches ya traidos con `.lean()` (objetos
 * planos, no documentos de Mongoose), por eso los tipos de abajo describen
 * la forma "plana" minima que necesitamos, no el Document completo.
 */

export interface LeanOleada {
  _id?: unknown;
  numero: number;
  fecha: Date | string;
  pesoKg: number;
  notas?: string;
}

export interface LeanHistorialEstado {
  estado: string;
  fecha: Date | string;
}

export interface LeanRecipiente {
  _id?: unknown;
  codigo: string;
  pesoKg: number;
  notas?: string;
}

export interface LeanBatch {
  _id?: unknown;
  numeroLote: string;
  fungusTypeId: unknown;
  estado: BatchEstado;
  descartado: boolean;
  motivoDescarte?: string;
  inoculacionGrano: {
    tipoGranoId: unknown;
    pesoGranoKg: number;
    precioPorKg: number;
    cantidadFrascos: number;
    fechaInicio: Date | string;
    fechaFin?: Date | string;
    diasEsperados: number;
  };
  crecimientoSustrato?: {
    tipoSustratoId?: unknown;
    kilosSustrato?: number;
    precioPorKg?: number;
    fechaInicio?: Date | string;
    fechaFin?: Date | string;
    diasEsperados?: number;
  };
  fructificacion?: {
    fechaInicio?: Date | string;
    fechaFin?: Date | string;
    diasEsperados?: number;
    recipientes?: LeanRecipiente[];
  };
  cosecha?: {
    fechaInicio?: Date | string;
    fechaFin?: Date | string;
    diasEsperados?: number;
  };
  oleadas?: LeanOleada[];
  historialEstados?: LeanHistorialEstado[];
}

function toDate(d: Date | string | undefined | null): Date | undefined {
  if (!d) return undefined;
  return d instanceof Date ? d : new Date(d);
}

/** Dias transcurridos entre fechaInicio y fechaFin ?? hoy. */
export function diasEnEtapa(
  fechaInicio: Date | string | undefined,
  fechaFin?: Date | string
): number | null {
  const inicio = toDate(fechaInicio);
  if (!inicio) return null;
  const fin = toDate(fechaFin) ?? new Date();
  return differenceInCalendarDays(fin, inicio);
}

/**
 * Desde inoculacionGrano.fechaInicio hasta cosecha.fechaFin ?? hoy, o hasta
 * la fecha del historialEstados 'finalizado'/'descartado' si el lote ya
 * cerro por esa via.
 */
export function diasTotalesLote(batch: LeanBatch): number | null {
  const inicio = toDate(batch.inoculacionGrano?.fechaInicio);
  if (!inicio) return null;

  const cierreHistorial = (batch.historialEstados ?? []).find(
    (h) => h.estado === "finalizado" || h.estado === "descartado"
  );

  const fin =
    toDate(batch.cosecha?.fechaFin) ??
    toDate(cierreHistorial?.fecha) ??
    new Date();

  return differenceInCalendarDays(fin, inicio);
}

export interface DiasPorEtapa {
  inoculacionGrano: number | null;
  crecimientoSustrato: number | null;
  fructificacion: number | null;
  cosecha: number | null;
}

export function diasPorEtapa(batch: LeanBatch): DiasPorEtapa {
  return {
    inoculacionGrano: diasEnEtapa(
      batch.inoculacionGrano?.fechaInicio,
      batch.inoculacionGrano?.fechaFin
    ),
    crecimientoSustrato: batch.crecimientoSustrato?.fechaInicio
      ? diasEnEtapa(
          batch.crecimientoSustrato.fechaInicio,
          batch.crecimientoSustrato.fechaFin
        )
      : null,
    fructificacion: batch.fructificacion?.fechaInicio
      ? diasEnEtapa(
          batch.fructificacion.fechaInicio,
          batch.fructificacion.fechaFin
        )
      : null,
    cosecha: batch.cosecha?.fechaInicio
      ? diasEnEtapa(batch.cosecha.fechaInicio, batch.cosecha.fechaFin)
      : null,
  };
}

/** Suma de oleadas[].pesoKg. */
export function pesoTotalCosechado(batch: LeanBatch): number {
  return (batch.oleadas ?? []).reduce((acc, o) => acc + (o.pesoKg || 0), 0);
}

/**
 * Eficiencia biologica = pesoTotalCosechado / kilosSustrato * 100.
 * Se calcula sobre el peso de sustrato (convencion del dominio), no sobre
 * el grano. Devuelve null si no hay crecimientoSustrato o kilosSustrato es 0.
 */
export function eficienciaBiologica(batch: LeanBatch): number | null {
  const kilosSustrato = batch.crecimientoSustrato?.kilosSustrato;
  if (!kilosSustrato) return null;
  const total = pesoTotalCosechado(batch);
  return (total / kilosSustrato) * 100;
}

export interface RendimientoOleada {
  numero: number;
  pesoKg: number;
  porcentajeDelTotal: number;
}

export function rendimientoPorOleada(batch: LeanBatch): RendimientoOleada[] {
  const total = pesoTotalCosechado(batch);
  return (batch.oleadas ?? []).map((o) => ({
    numero: o.numero,
    pesoKg: o.pesoKg,
    porcentajeDelTotal: total > 0 ? (o.pesoKg / total) * 100 : 0,
  }));
}

export interface CostoProduccion {
  costoGrano: number;
  costoSustrato: number;
  costoTotal: number;
  costoPorKgProducido: number | null;
}

export function costoProduccion(batch: LeanBatch): CostoProduccion {
  const costoGrano =
    (batch.inoculacionGrano?.pesoGranoKg || 0) *
    (batch.inoculacionGrano?.precioPorKg || 0);

  const costoSustrato =
    (batch.crecimientoSustrato?.kilosSustrato || 0) *
    (batch.crecimientoSustrato?.precioPorKg || 0);

  const costoTotal = costoGrano + costoSustrato;
  const total = pesoTotalCosechado(batch);

  return {
    costoGrano,
    costoSustrato,
    costoTotal,
    costoPorKgProducido: total > 0 ? costoTotal / total : null,
  };
}

export interface AlertaEtapaActual {
  demorado: boolean;
  diasTranscurridos: number;
  diasEsperados: number;
  diasDeDemora: number;
}

/**
 * Compara los dias transcurridos en la etapa activa contra su diasEsperados.
 * Para 'finalizado'/'descartado' siempre demorado: false.
 */
export function alertaEtapaActual(batch: LeanBatch): AlertaEtapaActual {
  const estado = batch.estado;

  if (estado === "finalizado" || estado === "descartado") {
    return {
      demorado: false,
      diasTranscurridos: 0,
      diasEsperados: 0,
      diasDeDemora: 0,
    };
  }

  let fechaInicio: Date | string | undefined;
  let diasEsperados = 0;

  switch (estado) {
    case "inoculacion_grano":
      fechaInicio = batch.inoculacionGrano?.fechaInicio;
      diasEsperados = batch.inoculacionGrano?.diasEsperados ?? 0;
      break;
    case "crecimiento_sustrato":
      fechaInicio = batch.crecimientoSustrato?.fechaInicio;
      diasEsperados = batch.crecimientoSustrato?.diasEsperados ?? 0;
      break;
    case "fructificacion":
      fechaInicio = batch.fructificacion?.fechaInicio;
      diasEsperados = batch.fructificacion?.diasEsperados ?? 0;
      break;
    case "cosecha":
      fechaInicio = batch.cosecha?.fechaInicio;
      diasEsperados = batch.cosecha?.diasEsperados ?? 0;
      break;
  }

  const diasTranscurridos = diasEnEtapa(fechaInicio) ?? 0;
  const diasDeDemora = Math.max(0, diasTranscurridos - diasEsperados);

  return {
    demorado: diasDeDemora > 0,
    diasTranscurridos,
    diasEsperados,
    diasDeDemora,
  };
}

export interface ResumenLote {
  numeroLote: string;
  estado: BatchEstado;
  diasTotales: number | null;
  diasPorEtapa: DiasPorEtapa;
  pesoTotalCosechado: number;
  eficienciaBiologica: number | null;
  rendimientoPorOleada: RendimientoOleada[];
  costoProduccion: CostoProduccion;
  alertaEtapaActual: AlertaEtapaActual;
}

export function resumenLote(batch: LeanBatch): ResumenLote {
  return {
    numeroLote: batch.numeroLote,
    estado: batch.estado,
    diasTotales: diasTotalesLote(batch),
    diasPorEtapa: diasPorEtapa(batch),
    pesoTotalCosechado: pesoTotalCosechado(batch),
    eficienciaBiologica: eficienciaBiologica(batch),
    rendimientoPorOleada: rendimientoPorOleada(batch),
    costoProduccion: costoProduccion(batch),
    alertaEtapaActual: alertaEtapaActual(batch),
  };
}

export type CatalogoCampo = "fungusTypeId" | "tipoGranoId" | "tipoSustratoId";

export interface AgregadoCatalogo {
  key: string;
  label: string;
  cantidadLotes: number;
  eficienciaBiologicaPromedio: number | null;
  diasTotalesPromedio: number | null;
  costoPorKgPromedio: number | null;
}

function idToString(id: unknown): string | null {
  if (!id) return null;
  if (typeof id === "string") return id;
  if (typeof id === "object" && id !== null) {
    // BSON/Mongoose ObjectId: chequear esto ANTES que `_id` generico, porque
    // mongoose.Types.ObjectId expone un getter `_id` que devuelve el mismo
    // ObjectId (para interoperar con populate) y entrar por la rama de
    // "documento poblado" de abajo causaria recursion infinita.
    const maybeObjectId = id as { _bsontype?: string; toHexString?: () => string };
    if (maybeObjectId._bsontype === "ObjectId" && typeof maybeObjectId.toHexString === "function") {
      return maybeObjectId.toHexString();
    }

    // Documento poblado (lean): objeto plano con su propio _id distinto.
    const anyId = id as { _id?: unknown; toString?: () => string };
    if (anyId._id) return idToString(anyId._id);
    if (typeof anyId.toString === "function") return anyId.toString();
  }
  return String(id);
}

function labelFor(id: unknown, fallback: string): string {
  if (id && typeof id === "object") {
    const populated = id as { nombre?: string };
    if (populated.nombre) return populated.nombre;
  }
  return fallback;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Agrupa lotes FINALIZADOS por el catalogo indicado (fungusTypeId,
 * tipoGranoId dentro de inoculacionGrano, o tipoSustratoId dentro de
 * crecimientoSustrato) y devuelve promedios pensados para comparativas
 * de dashboard.
 */
export function agregarPorCatalogo(
  batches: LeanBatch[],
  campo: CatalogoCampo
): AgregadoCatalogo[] {
  const finalizados = batches.filter((b) => b.estado === "finalizado");

  const grupos = new Map<
    string,
    { label: string; eb: number[]; dias: number[]; costoKg: number[] }
  >();

  for (const batch of finalizados) {
    let rawId: unknown;
    if (campo === "fungusTypeId") rawId = batch.fungusTypeId;
    else if (campo === "tipoGranoId") rawId = batch.inoculacionGrano?.tipoGranoId;
    else rawId = batch.crecimientoSustrato?.tipoSustratoId;

    const key = idToString(rawId);
    if (!key) continue;

    if (!grupos.has(key)) {
      grupos.set(key, {
        label: labelFor(rawId, key),
        eb: [],
        dias: [],
        costoKg: [],
      });
    }

    const grupo = grupos.get(key)!;

    const eb = eficienciaBiologica(batch);
    if (eb !== null) grupo.eb.push(eb);

    const dias = diasTotalesLote(batch);
    if (dias !== null) grupo.dias.push(dias);

    const costo = costoProduccion(batch).costoPorKgProducido;
    if (costo !== null) grupo.costoKg.push(costo);
  }

  const resultado: AgregadoCatalogo[] = [];
  for (const [key, grupo] of grupos.entries()) {
    resultado.push({
      key,
      label: grupo.label,
      cantidadLotes: finalizados.filter((b) => {
        let rawId: unknown;
        if (campo === "fungusTypeId") rawId = b.fungusTypeId;
        else if (campo === "tipoGranoId") rawId = b.inoculacionGrano?.tipoGranoId;
        else rawId = b.crecimientoSustrato?.tipoSustratoId;
        return idToString(rawId) === key;
      }).length,
      eficienciaBiologicaPromedio: average(grupo.eb),
      diasTotalesPromedio: average(grupo.dias),
      costoPorKgPromedio: average(grupo.costoKg),
    });
  }

  return resultado;
}
