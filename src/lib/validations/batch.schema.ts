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

// Correccion de datos cargados mal al crear el lote: el tipo de hongo y la
// fecha de inoculacion. Al menos uno de los dos.
export const updateBatchSchema = z
  .object({
    fungusTypeId: objectIdString.optional(),
    fechaInicio: z.coerce.date().optional(),
  })
  .refine((data) => !!data.fungusTypeId || !!data.fechaInicio, {
    message: "nada_para_actualizar:No hay cambios para guardar",
    path: ["fungusTypeId"],
  });
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;

export const comentarioSchema = z.object({
  texto: z
    .string("texto_requerido:Escribí un comentario")
    .trim()
    .min(1, "texto_requerido:Escribí un comentario")
    .max(2000, "texto_muy_largo:El texto es demasiado largo"),
});
export type ComentarioInput = z.infer<typeof comentarioSchema>;

// Receta de sustrato del lote (una sola). pellets/grano > 0; agua y cal
// pueden ser 0. notas vacia se toma como ausente.
const positivo = () =>
  z.number().positive("numero_positivo_requerido:Debe ser un número positivo");
const noNegativo = () =>
  z.number().min(0, "numero_no_negativo_requerido:No puede ser negativo");

const tachosRecetaSchema = z.object({
  cantidad: z
    .number()
    .int("numero_entero_requerido:Debe ser un número entero")
    .min(1, "numero_positivo_requerido:Debe ser un número positivo"),
  capacidad: positivo(),
  unidad: z.enum(["kg", "L"], "unidad_tacho_invalida:Unidad de tacho inválida"),
  densidadKgL: positivo().optional(),
});

export const recetaSustratoSchema = z
  .object({
    base: z.enum(["pellets", "grano", "tachos"], "base_receta_invalida:Base de receta inválida"),
    tachos: tachosRecetaSchema.optional(),
    pelletsKg: positivo(),
    aguaL: noNegativo(),
    calKg: noNegativo(),
    granoKg: positivo(),
    fecha: z.coerce.date(),
    notas: z
      .string()
      .trim()
      .max(2000, "texto_muy_largo:El texto es demasiado largo")
      .optional()
      .transform((v) => (v ? v : undefined)),
  })
  .superRefine((v, ctx) => {
    if (v.base === "tachos" && !v.tachos) {
      ctx.addIssue({
        code: "custom",
        path: ["tachos"],
        message: "tachos_requeridos:Faltan los datos de los tachos",
      });
    }
    if (v.base === "tachos" && v.tachos?.unidad === "L" && v.tachos.densidadKgL == null) {
      ctx.addIssue({
        code: "custom",
        path: ["tachos", "densidadKgL"],
        message: "numero_positivo_requerido:Debe ser un número positivo",
      });
    }
  })
  // Los tachos solo tienen sentido con base "tachos".
  .transform((v) => (v.base === "tachos" ? v : { ...v, tachos: undefined }));
export type RecetaSustratoInput = z.infer<typeof recetaSustratoSchema>;
