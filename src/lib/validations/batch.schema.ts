import { z } from "zod";

const objectIdString = z.string().min(1, "Id requerido");

// v2: el Batch ya no es una maquina de estados, asi que solo queda el
// schema de creacion. Los antiguos advanceTo*/addFlush/discard/updateBatch
// operaban sobre etapas embebidas en el Batch que ya no existen: esas
// operaciones ahora viven a nivel Recipiente (ver recipiente.schema.ts).
// El lote se puede iniciar eligiendo el tipo de hongo directamente, O
// eligiendo un frasco de micelio liquido disponible de Clonacion (el tipo
// de hongo se deriva de ese frasco -> su clonacion). Se requiere uno de
// los dos.
export const createBatchSchema = z
  .object({
    fungusTypeId: objectIdString.optional(),
    origenFrascoLiquidoId: objectIdString.optional(),
    tipoGranoId: objectIdString,
    pesoGranoKg: z.number().positive(),
    precioPorKg: z.number().positive(),
    cantidadFrascos: z.number().int().positive(),
    fechaInicio: z.coerce.date(),
    diasEsperados: z.number().positive().optional(),
  })
  .refine((data) => !!data.fungusTypeId || !!data.origenFrascoLiquidoId, {
    message: "Elegí un tipo de hongo o un frasco de micelio líquido de origen",
    path: ["fungusTypeId"],
  });
export type CreateBatchInput = z.infer<typeof createBatchSchema>;
