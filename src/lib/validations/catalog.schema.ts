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

// Prefijo opcional de 1 a 4 letras mayusculas usado para armar numeroLote
// (ej. "OST" -> OST-L-2026-003). "" (input de formulario vacio) -> undefined,
// sin error de validacion.
const inicialesSchema = z
  .string()
  .optional()
  .transform((v, ctx) => {
    const trimmed = v?.trim().toUpperCase();
    if (!trimmed) return undefined;
    if (!/^[A-Z]{1,4}$/.test(trimmed)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Iniciales: 1 a 4 letras mayúsculas" });
      return z.NEVER;
    }
    return trimmed;
  });

// FungusType tiene campos propios ademas del genero {nombre, notas}.
// v2: 3 campos en vez de 4 -- "cosecha" se elimino porque cosechar es una
// actividad abierta por recipiente (oleadas sucesivas), no tiene sentido
// un "dias esperados" fijo para esa etapa.
export const diasEsperadosDefaultSchema = z.object({
  inoculacionGrano: z.number().positive(),
  incubacion: z.number().positive(),
  fructificacion: z.number().positive(),
  // Opcional: agregado para Clonacion. Los hongos ya creados en la base
  // real no lo tienen, y no forzamos requerirlo aca para no romperlos.
  colonizacionPlacas: z.number().positive().optional(),
});

export const fungusTypeCreateSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es requerido"),
  nombreCientifico: z.string().trim().optional(),
  notas: z.string().trim().optional(),
  iniciales: inicialesSchema,
  diasEsperadosDefault: diasEsperadosDefaultSchema,
});

export const fungusTypeUpdateSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  nombreCientifico: z.string().trim().optional(),
  notas: z.string().trim().optional(),
  iniciales: inicialesSchema,
  activo: z.boolean().optional(),
  diasEsperadosDefault: diasEsperadosDefaultSchema.partial().optional(),
});

export type FungusTypeCreateInput = z.infer<typeof fungusTypeCreateSchema>;
export type FungusTypeUpdateInput = z.infer<typeof fungusTypeUpdateSchema>;
