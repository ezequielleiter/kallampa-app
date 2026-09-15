import { z } from "zod";
import { PLACA_ESTADOS } from "@/models/Placa";
import { FRASCO_LIQUIDO_ESTADOS } from "@/models/FrascoLiquido";

const objectIdString = z.string().min(1, "Id requerido");

export const createClonacionSchema = z.object({
  fungusTypeId: objectIdString,
  cantidadPlacas: z.number().int().positive(),
  fechaInicio: z.coerce.date(),
  diasEsperados: z.number().positive().optional(),
});
export type CreateClonacionInput = z.infer<typeof createClonacionSchema>;

export const updatePlacaEstadoSchema = z.object({
  estado: z.enum(PLACA_ESTADOS),
});
export type UpdatePlacaEstadoInput = z.infer<typeof updatePlacaEstadoSchema>;

// No pide clonacionId: se deriva de la placa de origen (origenPlacaId).
export const createFrascoLiquidoSchema = z.object({
  origenPlacaId: objectIdString,
  fechaCreacion: z.coerce.date(),
});
export type CreateFrascoLiquidoInput = z.infer<typeof createFrascoLiquidoSchema>;

export const updateFrascoLiquidoEstadoSchema = z.object({
  estado: z.enum(FRASCO_LIQUIDO_ESTADOS),
});
export type UpdateFrascoLiquidoEstadoInput = z.infer<typeof updateFrascoLiquidoEstadoSchema>;

export { PLACA_ESTADOS, FRASCO_LIQUIDO_ESTADOS };
