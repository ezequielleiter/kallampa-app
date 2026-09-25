import { z } from "zod";

const medidaSchema = z
  .number("numero_positivo_requerido:Debe ser un número positivo")
  .positive("numero_positivo_requerido:Debe ser un número positivo");

export const createInvernaderoSchema = z.object({
  nombre: z.string().trim().min(1, "nombre_requerido:El nombre es requerido"),
  altoM: medidaSchema,
  largoM: medidaSchema,
  profundidadM: medidaSchema,
  notas: z.string().trim().optional(),
});
export type CreateInvernaderoInput = z.infer<typeof createInvernaderoSchema>;

export const updateInvernaderoSchema = z.object({
  nombre: z.string().trim().min(1, "nombre_requerido:El nombre es requerido").optional(),
  altoM: medidaSchema.optional(),
  largoM: medidaSchema.optional(),
  profundidadM: medidaSchema.optional(),
  notas: z.string().trim().optional(),
  activo: z.boolean().optional(),
});
export type UpdateInvernaderoInput = z.infer<typeof updateInvernaderoSchema>;

// --- Dispositivos de monitoreo ----------------------------------------------
//
// El dominio es el host del micro en la red local (hostname tipo
// `sensor-carpa1.local` o una IP), con puerto y ruta opcionales. Se acepta
// pegado con `http://`/`https://` y barra final; se guarda normalizado sin
// ellos (el link se arma como `http://{dominio}`).

const DOMINIO_INVALIDO = "dominio_invalido:Ingresá un dominio o IP válido (ej.: sensor-carpa1.local)";
// host (letras, numeros, guiones y puntos) + :puerto opcional + /ruta opcional
const DOMINIO_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*(:\d{1,5})?(\/[^\s]*)?$/i;

export function normalizarDominio(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

const dominioSchema = z
  .string()
  .transform(normalizarDominio)
  .pipe(z.string().min(1, DOMINIO_INVALIDO).regex(DOMINIO_RE, DOMINIO_INVALIDO));

export const dispositivoSchema = z.object({
  nombre: z.string().trim().min(1, "nombre_requerido:El nombre es requerido"),
  dominio: dominioSchema,
});
export type DispositivoInput = z.infer<typeof dispositivoSchema>;

export const updateDispositivoSchema = z.object({
  nombre: z.string().trim().min(1, "nombre_requerido:El nombre es requerido").optional(),
  dominio: dominioSchema.optional(),
});
export type UpdateDispositivoInput = z.infer<typeof updateDispositivoSchema>;
