// Helpers de UI para trabajar con Recipiente/Jar en el detalle de un lote.
//
// A diferencia de `src/lib/metrics.ts` (que describe `ResumenLote`, la forma
// que devuelve el backend en `/api/stats`), este archivo es 100% cliente:
// deriva metricas de exhibicion (dias transcurridos, alertas, peso
// cosechado, costo) a partir de `BatchDetail` tal como lo devuelve
// `GET /api/batches/[id]` (que NO incluye un `resumen` precalculado, solo
// `{...batch, jars, recipientes}`).
import { differenceInCalendarDays } from "date-fns";
import { RECIPIENTE_ESTADOS_TERMINALES, type EstadoDerivado } from "@/lib/constants";
import type { Batch, Jar, Recipiente } from "@/lib/types";

function toDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  return new Date(value);
}

/** Dias transcurridos entre `fechaInicio` y hoy (piso de calendario). */
export function diasTranscurridos(fechaInicio: string | undefined): number | null {
  const inicio = toDate(fechaInicio);
  if (!inicio) return null;
  return differenceInCalendarDays(new Date(), inicio);
}

export interface RecipienteAlerta {
  demorado: boolean;
  diasTranscurridos: number | null;
  diasEsperados: number | null;
}

/**
 * Alerta de demora del recipiente en su etapa ACTIVA actual (incubando o
 * fructificando). Los recipientes en un estado terminal nunca estan
 * demorados: ya no hay una etapa "en curso" que pueda demorarse.
 */
export function alertaRecipiente(r: Recipiente): RecipienteAlerta {
  if (r.estado === "incubando") {
    const dias = diasTranscurridos(r.fechaInicioIncubacion);
    const esperados = r.diasEsperadosIncubacion ?? null;
    return {
      demorado: dias !== null && esperados !== null && dias > esperados,
      diasTranscurridos: dias,
      diasEsperados: esperados,
    };
  }
  if (r.estado === "fructificando") {
    const dias = diasTranscurridos(r.fechaInicioFructificacion);
    const esperados = r.diasEsperadosFructificacion ?? null;
    return {
      demorado: dias !== null && esperados !== null && dias > esperados,
      diasTranscurridos: dias,
      diasEsperados: esperados,
    };
  }
  return { demorado: false, diasTranscurridos: null, diasEsperados: null };
}

/** Suma de `oleadas[].pesoKg` de un unico recipiente. */
export function pesoCosechadoRecipiente(r: Recipiente): number {
  return r.oleadas.reduce((acc, o) => acc + (o.pesoKg || 0), 0);
}

/** Suma de `oleadas[].pesoKg` de todos los recipientes de un lote. */
export function pesoTotalCosechado(recipientes: Recipiente[]): number {
  return recipientes.reduce((acc, r) => acc + pesoCosechadoRecipiente(r), 0);
}

export interface CostoProduccionBatch {
  costoGrano: number;
  costoSustrato: number;
  costoTotal: number;
  costoPorKgProducido: number | null;
}

/**
 * Costo total del lote: grano (a nivel batch) + sustrato (sumado de todos
 * los recipientes, cada uno con su propio peso/precio).
 */
export function costoProduccionBatch(
  batch: Batch,
  recipientes: Recipiente[]
): CostoProduccionBatch {
  const costoGrano =
    (batch.inoculacionGrano?.pesoGranoKg || 0) * (batch.inoculacionGrano?.precioPorKg || 0);
  const costoSustrato = recipientes.reduce(
    (acc, r) => acc + (r.pesoSustratoKg || 0) * (r.precioPorKg || 0),
    0
  );
  const costoTotal = costoGrano + costoSustrato;
  const total = pesoTotalCosechado(recipientes);

  return {
    costoGrano,
    costoSustrato,
    costoTotal,
    costoPorKgProducido: total > 0 ? costoTotal / total : null,
  };
}

/** Eficiencia biologica = peso cosechado / peso de sustrato total * 100. */
export function eficienciaBiologicaBatch(recipientes: Recipiente[]): number | null {
  const pesoSustrato = recipientes.reduce((acc, r) => acc + (r.pesoSustratoKg || 0), 0);
  if (!pesoSustrato) return null;
  return (pesoTotalCosechado(recipientes) / pesoSustrato) * 100;
}

/**
 * Estado derivado del lote: 'en_progreso' si le queda algo activo entre sus
 * frascos (no usado/contaminado) o recipientes (no en un estado terminal),
 * 'finalizado' si no. Espejo cliente de lo que ya devuelve
 * `GET /api/batches` (estadoDerivado) para listas, pero el detalle de un
 * lote (`GET /api/batches/[id]`) no trae ese campo — lo calculamos aca con
 * la misma regla de dominio.
 */
export function estadoDerivadoBatch(jars: Jar[], recipientes: Recipiente[]): EstadoDerivado {
  const jarActivo = jars.some((j) => j.estado === "colonizando" || j.estado === "colonizado");
  const recipienteActivo = recipientes.some(
    (r) => !RECIPIENTE_ESTADOS_TERMINALES.includes(r.estado)
  );
  return jarActivo || recipienteActivo ? "en_progreso" : "finalizado";
}

/** Cantidad de recipientes actualmente demorados en su etapa activa. */
export function alertasBatch(recipientes: Recipiente[]): number {
  return recipientes.filter((r) => alertaRecipiente(r).demorado).length;
}

/** Etiqueta legible de los frascos de origen de un recipiente (poblados o no). */
export function getOrigenFrascosLabel(r: Recipiente): string {
  if (r.origenFrascoIds.length === 0) return "—";
  return r.origenFrascoIds
    .map((o) => (typeof o === "string" ? o : o.numeroGuia))
    .join(", ");
}
