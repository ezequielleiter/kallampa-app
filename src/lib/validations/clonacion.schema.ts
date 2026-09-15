import { z } from "zod";
import { PLACA_ESTADOS } from "@/models/Placa";
import { FRASCO_LIQUIDO_ESTADOS } from "@/models/FrascoLiquido";

const objectIdString = z.string().min(1, "Id requerido");

// La clonacion se puede iniciar eligiendo el hongo directamente, O a partir
// de un Jar ya colonizado/usado, O de un Recipiente fructificando (el
// hongo se deriva del lote de origen). Se requiere exactamente una de las
// tres fuentes -- mismo estilo de refine que createBatchSchema.
export const createClonacionSchema = z
  .object({
    fungusTypeId: objectIdString.optional(),
    origenJarId: objectIdString.optional(),
    origenRecipienteId: objectIdString.optional(),
    cantidadPlacas: z.number().int().positive(),
    fechaInicio: z.coerce.date(),
    diasEsperados: z.number().positive().optional(),
  })
  .refine(
    (data) => !!data.fungusTypeId || !!data.origenJarId || !!data.origenRecipienteId,
    {
      message: "Elegí un tipo de hongo, un frasco de origen o un recipiente de origen",
      path: ["fungusTypeId"],
    }
  )
  .refine((data) => !(data.origenJarId && data.origenRecipienteId), {
    message: "No se puede clonar desde un frasco y un recipiente al mismo tiempo",
    path: ["origenJarId"],
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
