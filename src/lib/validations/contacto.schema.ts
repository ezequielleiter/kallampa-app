import { z } from "zod";

// Formulario publico de la landing. Todo con topes de largo: el endpoint no
// requiere cuenta. `sitio` es un campo trampa (oculto para personas): si
// viene con algo, es un bot y la API responde OK sin guardar.
const texto = (max: number) => z.string().trim().max(max, "texto_muy_largo:El texto es demasiado largo");

export const contactoSchema = z.object({
  nombre: texto(120).min(1, "nombre_requerido:El nombre es requerido"),
  email: z.string().trim().max(200).email("email_invalido:Email invalido"),
  telefono: texto(40).optional(),
  invernaderos: z
    .number("numero_entero_requerido:Debe ser un número entero")
    .int("numero_entero_requerido:Debe ser un número entero")
    .min(1, "numero_positivo_requerido:Debe ser un número positivo")
    .max(10_000, "numero_invalido:Debe ser un número")
    .optional(),
  superficie: texto(60).optional(),
  mensaje: texto(2000).optional(),
  sitio: z.string().optional(),
});
export type ContactoInput = z.infer<typeof contactoSchema>;
