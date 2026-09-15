import { z } from "zod";

export const createNotaSchema = z.object({
  titulo: z.string().trim().min(1, "El título es requerido"),
  contenido: z.string(),
});
export type CreateNotaInput = z.infer<typeof createNotaSchema>;

export const updateNotaSchema = z.object({
  titulo: z.string().trim().min(1, "El título es requerido").optional(),
  contenido: z.string().optional(),
});
export type UpdateNotaInput = z.infer<typeof updateNotaSchema>;
