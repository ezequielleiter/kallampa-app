import { z } from "zod";
import { TAREA_ESTADOS } from "@/models/Tarea";

export const createTareaSchema = z.object({
  titulo: z.string().trim().min(1, "El título es requerido"),
  descripcion: z.string().optional().default(""),
  fecha: z.coerce.date(),
  estado: z.enum(TAREA_ESTADOS).optional().default("pendiente"),
});
export type CreateTareaInput = z.infer<typeof createTareaSchema>;

export const updateTareaSchema = createTareaSchema.partial();
export type UpdateTareaInput = z.infer<typeof updateTareaSchema>;
