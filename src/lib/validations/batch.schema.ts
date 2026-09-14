import { z } from "zod";

const objectIdString = z.string().min(1, "Id requerido");

// v2: el Batch ya no es una maquina de estados, asi que solo queda el
// schema de creacion. Los antiguos advanceTo*/addFlush/discard/updateBatch
// operaban sobre etapas embebidas en el Batch que ya no existen: esas
// operaciones ahora viven a nivel Recipiente (ver recipiente.schema.ts).
export const createBatchSchema = z.object({
  fungusTypeId: objectIdString,
  tipoGranoId: objectIdString,
  pesoGranoKg: z.number().positive(),
  precioPorKg: z.number().positive(),
  cantidadFrascos: z.number().int().positive(),
  fechaInicio: z.coerce.date(),
  diasEsperados: z.number().positive().optional(),
});
export type CreateBatchInput = z.infer<typeof createBatchSchema>;
