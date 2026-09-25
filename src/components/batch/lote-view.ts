// Derivaciones de solo-UI para el detalle de lote (Stepper de etapas y
// dias de incubacion de cada recipiente). Viven aca y no en
// src/lib/recipiente-utils.ts porque son exclusivas de esta vista.
import { differenceInCalendarDays } from "date-fns";
import type { StepState } from "@/components/kallampa/Stepper";
import type { Jar, Recipiente } from "@/lib/types";
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
