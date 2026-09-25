import { z } from "zod";

const medidaSchema = z
  .number("numero_positivo_requerido:Debe ser un número positivo")
  .positive("numero_positivo_requerido:Debe ser un número positivo");

// Positivo opcional "borrable": en el PATCH `null` elimina el valor.
const positivoOpcional = z.union([medidaSchema, z.null()]);

export const createInvernaderoSchema = z.object({
  nombre: z.string().trim().min(1, "nombre_requerido:El nombre es requerido"),
  altoM: medidaSchema,
  largoM: medidaSchema,
  profundidadM: medidaSchema,
  notas: z.string().trim().optional(),
  // Precio del kWh del proveedor de electricidad (para estimar el costo de
  // la calefaccion).
  precioKwh: positivoOpcional.optional(),
});
export type CreateInvernaderoInput = z.infer<typeof createInvernaderoSchema>;

export const updateInvernaderoSchema = z.object({
  nombre: z.string().trim().min(1, "nombre_requerido:El nombre es requerido").optional(),
  altoM: medidaSchema.optional(),
  largoM: medidaSchema.optional(),
  profundidadM: medidaSchema.optional(),
  notas: z.string().trim().optional(),
  precioKwh: positivoOpcional.optional(),
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

const INFLUX_ID_INVALIDO =
  "influx_id_invalido:El ID de InfluxDB son 6 caracteres hexadecimales (ej.: 0c2cc8)";

// Opcionales "borrables": en el PATCH `null` (o "") elimina el valor.
const influxIdSchema = z
  .union([z.string(), z.null()])
  .transform((v) => (v == null || v.trim() === "" ? null : v.trim().toLowerCase()))
  .pipe(z.union([z.null(), z.string().regex(/^[0-9a-f]{6}$/, INFLUX_ID_INVALIDO)]));

const numeroOpcional = z.union([
  z.number("numero_invalido:Debe ser un número").refine(Number.isFinite, "numero_invalido:Debe ser un número"),
  z.null(),
]);

const RANGO_INVERTIDO = "rango_min_max_invalido:La mínima tiene que ser menor que la máxima";

function minMenorQueMax(
  d: { tempMin?: number | null; tempMax?: number | null; humMin?: number | null; humMax?: number | null },
  ctx: z.RefinementCtx
) {
  for (const [min, max, path] of [
    [d.tempMin, d.tempMax, "tempMax"],
    [d.humMin, d.humMax, "humMax"],
  ] as const) {
    if (min != null && max != null && min >= max) {
      ctx.addIssue({ code: "custom", message: RANGO_INVERTIDO, path: [path] });
    }
  }
}

const camposMonitoreo = {
  influxId: influxIdSchema.optional(),
  tempMin: numeroOpcional.optional(),
  tempMax: numeroOpcional.optional(),
  humMin: numeroOpcional.optional(),
  humMax: numeroOpcional.optional(),
  // Potencia del calefactor que controla el equipo, en kW.
  calefactorKw: positivoOpcional.optional(),
};

export const dispositivoSchema = z
  .object({
    nombre: z.string().trim().min(1, "nombre_requerido:El nombre es requerido"),
    dominio: dominioSchema,
    ...camposMonitoreo,
  })
  .superRefine(minMenorQueMax);
export type DispositivoInput = z.infer<typeof dispositivoSchema>;

export const updateDispositivoSchema = z
  .object({
    nombre: z.string().trim().min(1, "nombre_requerido:El nombre es requerido").optional(),
    dominio: dominioSchema.optional(),
    ...camposMonitoreo,
  })
  .superRefine(minMenorQueMax);
export type UpdateDispositivoInput = z.infer<typeof updateDispositivoSchema>;
