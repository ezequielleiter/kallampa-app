import { z } from "zod";

// Schema generico reutilizado por los catalogos simples (GrainType, SubstrateType)
export const catalogCreateSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es requerido"),
  notas: z.string().trim().optional(),
});

export const catalogUpdateSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es requerido").optional(),
  notas: z.string().trim().optional(),
  activo: z.boolean().optional(),
});

export type CatalogCreateInput = z.infer<typeof catalogCreateSchema>;
export type CatalogUpdateInput = z.infer<typeof catalogUpdateSchema>;

// FungusType tiene campos propios ademas del genero {nombre, notas}.
// v2: 3 campos en vez de 4 -- "cosecha" se elimino porque cosechar es una
// actividad abierta por recipiente (oleadas sucesivas), no tiene sentido
// un "dias esperados" fijo para esa etapa.
export const diasEsperadosDefaultSchema = z.object({
  inoculacionGrano: z.number().positive(),
  incubacion: z.number().positive(),
  fructificacion: z.number().positive(),
});

export const fungusTypeCreateSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es requerido"),
  nombreCientifico: z.string().trim().optional(),
  notas: z.string().trim().optional(),
  diasEsperadosDefault: diasEsperadosDefaultSchema,
});

export const fungusTypeUpdateSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  nombreCientifico: z.string().trim().optional(),
  notas: z.string().trim().optional(),
  activo: z.boolean().optional(),
  diasEsperadosDefault: diasEsperadosDefaultSchema.partial().optional(),
});

export type FungusTypeCreateInput = z.infer<typeof fungusTypeCreateSchema>;
export type FungusTypeUpdateInput = z.infer<typeof fungusTypeUpdateSchema>;
