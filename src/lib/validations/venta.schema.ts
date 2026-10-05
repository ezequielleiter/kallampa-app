import { z } from "zod";

const objectIdString = z.string().min(1, "id_requerido:Id requerido");

// "" (o solo espacios) => undefined, para que un textarea vacio no guarde nada.
export const notasOpcional = z
  .string()
  .trim()
  .max(2000, "texto_muy_largo:El texto es demasiado largo")
  .optional()
  .transform((v) => (v ? v : undefined));

export const ventaItemSchema = z.object({
  batchId: objectIdString,
  kg: z
    .number("kg_invalido:Los kg tienen que ser mayores a 0")
    .positive("kg_invalido:Los kg tienen que ser mayores a 0"),
  precioPorKg: z
    .number("precio_invalido:El precio no puede ser negativo")
    .min(0, "precio_invalido:El precio no puede ser negativo"),
});

export const MEDIOS_PAGO = ["efectivo", "transferencia", "mercadopago", "otro"] as const;

// fecha: el front manda "YYYY-MM-DD" (medianoche UTC).
export const ventaSchema = z.object({
  fecha: z.coerce.date("fecha_invalida:Fecha inválida"),
  clienteId: z.union([objectIdString, z.null()]).optional(),
  items: z
    .array(ventaItemSchema)
    .min(1, "venta_sin_items:Agregá al menos un lote")
    .refine(
      (items) => new Set(items.map((i) => i.batchId)).size === items.length,
      "lote_repetido_en_venta:No se puede repetir un lote en la misma venta"
    ),
  medioPago: z.enum(MEDIOS_PAGO, "medio_pago_invalido:Medio de pago inválido").default("efectivo"),
  cobrada: z.boolean().default(false),
  notas: notasOpcional,
});
export type VentaInput = z.infer<typeof ventaSchema>;

// PATCH que solo marca cobrada/pendiente.
export const cobroVentaSchema = z.object({ cobrada: z.boolean() }).strict();
export type CobroVentaInput = z.infer<typeof cobroVentaSchema>;
