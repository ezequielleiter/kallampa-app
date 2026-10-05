// Derivaciones de solo-UI para el detalle de lote (Stepper de etapas y
// dias de incubacion de cada recipiente). Viven aca y no en
// src/lib/recipiente-utils.ts porque son exclusivas de esta vista.
import { differenceInCalendarDays } from "date-fns";
import type { StepState } from "@/components/kallampa/Stepper";
import type { BatchDetail, Jar, Oleada, Recipiente } from "@/lib/types";
import { pesoTotalCosechado } from "@/lib/recipiente-utils";

export interface EtapasLote {
  inoculacion: StepState;
  incubacion: StepState;
  fructificacion: StepState;
  cosecha: StepState;
}

/**
 * Estado de cada etapa del lote a partir de sus frascos y recipientes:
 * "active" mientras haya algo en curso en esa etapa, "done" cuando ya paso
 * por ella y no queda nada en curso, "pending" si todavia no empezo.
 */
export function etapasLote(jars: Jar[], recipientes: Recipiente[]): EtapasLote {
  const colonizando = jars.some((j) => j.estado === "colonizando");
  const incubando = recipientes.some((r) => r.estado === "incubando");
  const fructificando = recipientes.some((r) => r.estado === "fructificando");
  const llegoAFructificar = recipientes.some((r) => !!r.fechaInicioFructificacion);
  const cosechado = pesoTotalCosechado(recipientes) > 0;

  return {
    inoculacion: colonizando ? "active" : "done",
    incubacion: recipientes.length === 0 ? "pending" : incubando ? "active" : "done",
    fructificacion: !llegoAFructificar ? "pending" : fructificando ? "active" : "done",
    cosecha: fructificando ? "active" : cosechado ? "done" : "pending",
  };
}

/**
 * Dias de incubacion de un recipiente: si sigue incubando, los dias
 * transcurridos hasta hoy; si ya paso a fructificacion, los que duro la
 * incubacion. `null` si no se puede calcular (p. ej. se descarto incubando).
 */
export function diasIncubacion(r: Recipiente): number | null {
  const inicio = new Date(r.fechaInicioIncubacion);
  if (r.estado === "incubando") return differenceInCalendarDays(new Date(), inicio);
  if (r.fechaInicioFructificacion) {
    return differenceInCalendarDays(new Date(r.fechaInicioFructificacion), inicio);
  }
  return null;
}

/** Nombre del sustrato de un recipiente (poblado o no). */
export function nombreSustrato(r: Recipiente): string {
  return typeof r.tipoSustratoId === "object" ? r.tipoSustratoId.nombre : "—";
}

/** Sufijo corto del codigo ("ENK-L-2026-001-R02" → "R02") para textos densos. */
export function codigoCorto(codigo: string): string {
  const parts = codigo.split("-");
  return parts[parts.length - 1] || codigo;
}

export type EtapaTrazaKey = "origen" | "inoculacion" | "incubacion" | "fructificacion" | "cosecha";

/**
 * Datos de la pestaña Trazabilidad del lote: el estado de cada etapa y lo
 * que paso en ella. Sin textos — el componente los traduce y formatea.
 */
export interface TrazabilidadLote {
  etapas: Record<EtapaTrazaKey, StepState>;
  /** Cantidad de etapas en "done". */
  completas: number;
  origen: { _id: string; numeroGuia: string } | null;
  contaminados: number;
  /** Recipientes por fecha de inicio de incubacion. */
  incubacion: Recipiente[];
  /** Recipientes que llegaron a fructificar, por fecha de inicio. */
  fructificacion: Recipiente[];
  /** Todas las oleadas del lote, de la mas vieja a la mas nueva. */
  oleadas: { recipiente: Recipiente; oleada: Oleada }[];
  pesoTotal: number;
}

const porFecha = <T>(fecha: (x: T) => string) => (a: T, b: T) =>
  new Date(fecha(a)).getTime() - new Date(fecha(b)).getTime();

export function trazabilidadLote(batch: BatchDetail): TrazabilidadLote {
  const { jars, recipientes } = batch;
  const etapas: Record<EtapaTrazaKey, StepState> = {
    origen: "done",
    ...etapasLote(jars, recipientes),
  };
  const origen =
    typeof batch.origenFrascoLiquidoId === "object" ? batch.origenFrascoLiquidoId : null;

  return {
    etapas,
    completas: Object.values(etapas).filter((e) => e === "done").length,
    origen,
    contaminados: jars.filter((j) => j.estado === "contaminado").length,
    incubacion: [...recipientes].sort(porFecha((r) => r.fechaInicioIncubacion)),
    fructificacion: recipientes
      .filter((r) => !!r.fechaInicioFructificacion)
      .sort(porFecha((r) => r.fechaInicioFructificacion!)),
    oleadas: recipientes
      .flatMap((recipiente) => recipiente.oleadas.map((oleada) => ({ recipiente, oleada })))
      .sort(porFecha((x) => x.oleada.fecha)),
    pesoTotal: pesoTotalCosechado(recipientes),
  };
}
