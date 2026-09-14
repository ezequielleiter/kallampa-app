import { z } from "zod";

const objectIdString = z.string().min(1, "Id requerido");

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

export const advanceToSustratoSchema = z.object({
  tipoSustratoId: objectIdString,
  kilosSustrato: z.number().positive(),
  precioPorKg: z.number().positive(),
  fechaInicio: z.coerce.date(),
  diasEsperados: z.number().positive().optional(),
});
export type AdvanceToSustratoInput = z.infer<typeof advanceToSustratoSchema>;

export const recipienteInputSchema = z.object({
  codigo: z.string().trim().min(1, "El codigo es requerido"),
  pesoKg: z.number().positive(),
  notas: z.string().trim().optional(),
});

export const advanceToFructificacionSchema = z.object({
  fechaInicio: z.coerce.date(),
  diasEsperados: z.number().positive().optional(),
  recipientes: z.array(recipienteInputSchema).min(1, "Se requiere al menos un recipiente"),
});
export type AdvanceToFructificacionInput = z.infer<
  typeof advanceToFructificacionSchema
>;

export const advanceToCosechaSchema = z.object({
  fechaInicio: z.coerce.date(),
  diasEsperados: z.number().positive().optional(),
});
export type AdvanceToCosechaInput = z.infer<typeof advanceToCosechaSchema>;

// Sin payload extra para 'finalizado'
export const advanceToFinalizadoSchema = z.object({}).optional();

export const advanceStageSchema = z.discriminatedUnion("targetStage", [
  advanceToSustratoSchema.extend({
    targetStage: z.literal("crecimiento_sustrato"),
  }),
  advanceToFructificacionSchema.extend({
    targetStage: z.literal("fructificacion"),
  }),
  advanceToCosechaSchema.extend({ targetStage: z.literal("cosecha") }),
  z.object({ targetStage: z.literal("finalizado") }),
]);
export type AdvanceStageInput = z.infer<typeof advanceStageSchema>;

export const addFlushSchema = z.object({
  numero: z.number().int().positive(),
  fecha: z.coerce.date(),
  pesoKg: z.number().positive(),
  notas: z.string().trim().optional(),
});
export type AddFlushInput = z.infer<typeof addFlushSchema>;

export const updateFlushSchema = z.object({
  numero: z.number().int().positive().optional(),
  fecha: z.coerce.date().optional(),
  pesoKg: z.number().positive().optional(),
  notas: z.string().trim().optional(),
});
export type UpdateFlushInput = z.infer<typeof updateFlushSchema>;

export const discardBatchSchema = z.object({
  motivo: z.string().trim().min(3, "El motivo debe tener al menos 3 caracteres"),
});
export type DiscardBatchInput = z.infer<typeof discardBatchSchema>;

// Edicion general de campos sueltos vía PATCH /api/batches/[id]
export const updateBatchSchema = z.object({
  inoculacionGrano: z
    .object({
      diasEsperados: z.number().positive().optional(),
      fechaInicio: z.coerce.date().optional(),
      pesoGranoKg: z.number().positive().optional(),
      precioPorKg: z.number().positive().optional(),
    })
    .partial()
    .optional(),
  crecimientoSustrato: z
    .object({
      diasEsperados: z.number().positive().optional(),
      kilosSustrato: z.number().positive().optional(),
      precioPorKg: z.number().positive().optional(),
      fechaInicio: z.coerce.date().optional(),
    })
    .partial()
    .optional(),
  fructificacion: z
    .object({
      diasEsperados: z.number().positive().optional(),
      fechaInicio: z.coerce.date().optional(),
    })
    .partial()
    .optional(),
  cosecha: z
    .object({
      diasEsperados: z.number().positive().optional(),
      fechaInicio: z.coerce.date().optional(),
    })
    .partial()
    .optional(),
});
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;
