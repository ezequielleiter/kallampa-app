import { z } from "zod";
import { PLACA_ESTADOS } from "@/models/Placa";
import { FRASCO_LIQUIDO_ESTADOS } from "@/models/FrascoLiquido";
import { ORIGEN_PROCESO } from "@/models/Clonacion";

const objectIdString = z.string().min(1, "Id requerido");

export { ORIGEN_PROCESO };
export type OrigenProceso = (typeof ORIGEN_PROCESO)[number];

// La clonacion se puede iniciar por 3 caminos (origenProceso):
// - "placa": el flujo de siempre -- eligiendo el hongo directamente, O a
//   partir de un Jar ya colonizado/usado, O de un Recipiente fructificando
//   (el hongo se deriva del lote de origen); se requiere exactamente una
//   de las tres fuentes, y `cantidadPlacas`.
// - "frascoGrano": origen obligatorio un Jar de Produccion ya
//   colonizado/usado (el hongo se hereda de ahi); no admite recipiente ni
//   hongo explicito; requiere `cantidadFrascos`.
// - "comprado": sin origen interno, el hongo se elige directo; requiere
//   `cantidadFrascos`.
export const createClonacionSchema = z
  .object({
    origenProceso: z.enum(ORIGEN_PROCESO).default("placa"),
    fungusTypeId: objectIdString.optional(),
    origenJarId: objectIdString.optional(),
    origenRecipienteId: objectIdString.optional(),
    fechaInicio: z.coerce.date(),
    recetaAgar: z.string().trim().optional(),
    cantidadPlacas: z.number().int().positive().optional(),
    diasEsperados: z.number().positive().optional(),
    cantidadFrascos: z.number().int().positive().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.origenProceso === "placa") {
      if (!data.fungusTypeId && !data.origenJarId && !data.origenRecipienteId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Elegí un tipo de hongo, un frasco de origen o un recipiente de origen",
          path: ["fungusTypeId"],
        });
      }
      if (data.origenJarId && data.origenRecipienteId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "No se puede clonar desde un frasco y un recipiente al mismo tiempo",
          path: ["origenJarId"],
        });
      }
      if (!data.cantidadPlacas) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indicá la cantidad de placas",
          path: ["cantidadPlacas"],
        });
      }
    } else if (data.origenProceso === "frascoGrano") {
      if (!data.origenJarId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Elegí un frasco de grano de origen",
          path: ["origenJarId"],
        });
      }
      if (data.origenRecipienteId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Este camino no admite un recipiente de origen",
          path: ["origenRecipienteId"],
        });
      }
      if (data.fungusTypeId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El hongo se hereda del frasco de grano elegido",
          path: ["fungusTypeId"],
        });
      }
      if (!data.cantidadFrascos) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indicá la cantidad de frascos",
          path: ["cantidadFrascos"],
        });
      }
    } else {
      // "comprado"
      if (!data.fungusTypeId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Elegí un tipo de hongo",
          path: ["fungusTypeId"],
        });
      }
      if (data.origenJarId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Este camino no admite un frasco de origen",
          path: ["origenJarId"],
        });
      }
      if (data.origenRecipienteId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Este camino no admite un recipiente de origen",
          path: ["origenRecipienteId"],
        });
      }
      if (!data.cantidadFrascos) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indicá la cantidad de frascos",
          path: ["cantidadFrascos"],
        });
      }
    }
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
