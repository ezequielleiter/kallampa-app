import { z } from "zod";

const NOMBRE = "nombre_requerido:El nombre es requerido";
const TEXTO_LARGO = "texto_muy_largo:El texto es demasiado largo";

const textoOpcional = z
  .string()
  .trim()
  .max(2000, TEXTO_LARGO)
  .optional()
  .transform((v) => (v ? v : undefined));

// En el PATCH `null` (o "") borra el campo.
const textoBorrable = z
  .union([z.string().trim().max(2000, TEXTO_LARGO), z.null()])
  .transform((v) => (v ? v : null));

export const createClienteSchema = z.object({
  nombre: z.string().trim().min(1, NOMBRE).max(200, TEXTO_LARGO),
  contacto: textoOpcional,
  notas: textoOpcional,
});
export type CreateClienteInput = z.infer<typeof createClienteSchema>;

export const updateClienteSchema = z.object({
  nombre: z.string().trim().min(1, NOMBRE).max(200, TEXTO_LARGO).optional(),
  contacto: textoBorrable.optional(),
  notas: textoBorrable.optional(),
  activo: z.boolean().optional(),
});
export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;
