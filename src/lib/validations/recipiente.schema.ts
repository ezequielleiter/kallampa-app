import { z } from "zod";
import { RECIPIENTE_ESTADOS } from "@/models/Recipiente";

const objectIdString = z.string().min(1, "Id requerido");

export const createRecipienteSchema = z.object({
  batchId: objectIdString,
  origenFrascoIds: z.array(objectIdString).min(1, "Se requiere al menos un frasco de origen"),
  tipoSustratoId: objectIdString,
  pesoSustratoKg: z.number().positive(),
  precioPorKg: z.number().positive(),
  fechaInicioIncubacion: z.coerce.date(),
  diasEsperadosIncubacion: z.number().positive().optional(),
});
export type CreateRecipienteInput = z.infer<typeof createRecipienteSchema>;

export const fructificarRecipienteSchema = z.object({
  fechaInicioFructificacion: z.coerce.date(),
  diasEsperadosFructificacion: z.number().positive().optional(),
});
export type FructificarRecipienteInput = z.infer<typeof fructificarRecipienteSchema>;

export const addOleadaSchema = z.object({
  fecha: z.coerce.date(),
  pesoKg: z.number().positive(),
  notas: z.string().trim().optional(),
});
export type AddOleadaInput = z.infer<typeof addOleadaSchema>;

export const updateOleadaSchema = z.object({
  fecha: z.coerce.date().optional(),
  pesoKg: z.number().positive().optional(),
  notas: z.string().trim().optional(),
});
export type UpdateOleadaInput = z.infer<typeof updateOleadaSchema>;

// Estados terminales que se pueden asignar manualmente. 'incubando' y
// 'fructificando' se alcanzan por su propio flujo (creacion / fructificar),
// nunca via este endpoint.
export const marcarEstadoRecipienteSchema = z.object({
  estado: z.enum(["finalizado", "contaminado", "descartado"] as const),
  motivo: z.string().trim().optional(),
});
export type MarcarEstadoRecipienteInput = z.infer<typeof marcarEstadoRecipienteSchema>;

// Re-exportado por conveniencia para quien quiera validar contra el enum
// completo del modelo (ej. filtros de query ?estado=).
export { RECIPIENTE_ESTADOS };
