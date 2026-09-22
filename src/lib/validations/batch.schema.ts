import { z } from "zod";

const objectIdString = z.string().min(1, "id_requerido:Id requerido");

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
    pesoGranoKg: z.number().positive("numero_positivo_requerido:Debe ser un número positivo"),
    precioPorKg: z.number().positive("numero_positivo_requerido:Debe ser un número positivo"),
    cantidadFrascos: z
      .number()
      .int("numero_entero_requerido:Debe ser un número entero")
      .positive("numero_positivo_requerido:Debe ser un número positivo"),
    fechaInicio: z.coerce.date(),
    diasEsperados: z
      .number()
      .positive("numero_positivo_requerido:Debe ser un número positivo")
      .optional(),
  })
  .refine((data) => !!data.fungusTypeId || !!data.origenFrascoLiquidoId, {
    message:
      "hongo_o_frasco_liquido_origen_requerido:Elegí un tipo de hongo o un frasco de micelio líquido de origen",
    path: ["fungusTypeId"],
  });
export type CreateBatchInput = z.infer<typeof createBatchSchema>;
