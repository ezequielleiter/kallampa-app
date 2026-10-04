import { z } from "zod";
import { JAR_ESTADOS } from "@/models/Jar";

export const updateJarStateSchema = z.object({
  estado: z.enum(JAR_ESTADOS, "estado_jar_invalido:Estado de frasco invalido"),
});
export type UpdateJarStateInput = z.infer<typeof updateJarStateSchema>;

// Agregar frascos a un lote ya creado (por si `cantidadFrascos` se cargo
// mal al crearlo). Continuan la numeracion -F<n> del lote.
export const addJarsSchema = z.object({
  cantidad: z
    .number("numero_entero_requerido:Debe ser un número entero")
    .int("numero_entero_requerido:Debe ser un número entero")
    .positive("numero_positivo_requerido:Debe ser un número positivo"),
});
export type AddJarsInput = z.infer<typeof addJarsSchema>;
