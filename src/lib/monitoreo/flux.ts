// Consultas Flux del monitoreo. Todo lo que se interpola esta validado antes
// (id con INFLUX_ID_RE, rango contra RANGOS, ventana numerica, bucket del
// env), asi que no hay inyeccion posible desde la request.
import { INFLUX_ID_RE, RANGOS, type Rango, type TipoSerie } from "./tipos";

const CAMPOS: Record<TipoSerie, { valor: string; on: string }> = {
  calefaccion: { valor: "temperatura", on: "calefaccion_seg" },
  humedad: { valor: "humedad", on: "humidificador_seg" },
};

export function camposSerie(tipo: TipoSerie) {
  return CAMPOS[tipo];
}

function assertSeguro(bucket: string, id: string, range: Rango) {
  if (!INFLUX_ID_RE.test(id)) throw new Error("influx id invalido");
  if (!RANGOS.includes(range)) throw new Error("rango invalido");
  if (/["\\\n]/.test(bucket)) throw new Error("bucket invalido");
}

export function fluxSerie(opts: {
  bucket: string;
  id: string;
  range: Rango;
  windowSec: number;
  tipo: TipoSerie;
}): string {
  const { bucket, id, range, tipo } = opts;
  assertSeguro(bucket, id, range);
  const W = `${Math.max(1, Math.round(opts.windowSec))}s`;
  const { valor, on } = CAMPOS[tipo];
  return `base = from(bucket: "${bucket}")
  |> range(start: -${range})
  |> filter(fn: (r) => r.id == "${id}")
t = base
  |> filter(fn: (r) => r._measurement == "ambiente" and r._field == "${valor}")
  |> aggregateWindow(every: ${W}, fn: mean, createEmpty: false, timeSrc: "_start")
h = base
  |> filter(fn: (r) => r._measurement == "actuadores" and r._field == "${on}")
  |> aggregateWindow(every: ${W}, fn: sum, createEmpty: false, timeSrc: "_start")
  |> toFloat()
union(tables: [t, h])
  |> keep(columns: ["_time", "_field", "_value"])
  |> group()
  |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
  |> sort(columns: ["_time"])`;
}

/**
 * Ultimas marcas crudas de ambiente, para deducir el intervalo de muestreo
 * (temperatura y humedad comparten marca: se deduplican en JS).
 */
export function fluxMuestras(opts: { bucket: string; id: string; range: Rango }): string {
  const { bucket, id, range } = opts;
  assertSeguro(bucket, id, range);
  return `from(bucket: "${bucket}")
  |> range(start: -${range})
  |> filter(fn: (r) => r.id == "${id}" and r._measurement == "ambiente")
  |> keep(columns: ["_time"])
  |> group()
  |> sort(columns: ["_time"], desc: true)
  |> limit(n: 26)`;
}

/** Equipos del bucket (tag id) con su ultimo nombre `device`. */
export function fluxEquipos(bucket: string): string {
  if (/["\\\n]/.test(bucket)) throw new Error("bucket invalido");
  return `from(bucket: "${bucket}")
  |> range(start: -30d)
  |> filter(fn: (r) => r._measurement == "ambiente")
  |> keep(columns: ["_time", "id", "device"])
  |> group(columns: ["id"])
  |> sort(columns: ["_time"])
  |> last(column: "_time")
  |> group()
  |> keep(columns: ["id", "device"])`;
}

/**
 * Intervalo de muestreo deducido: mediana de la separacion entre marcas
 * consecutivas, redondeada a minutos. null si hay menos de 2 marcas.
 */
export function intervaloMuestreoSeg(tiemposMs: number[]): number | null {
  const ts = [...new Set(tiemposMs)].sort((a, b) => a - b);
  if (ts.length < 2) return null;
  const diffs = ts.slice(1).map((t, i) => (t - ts[i]) / 1000).sort((a, b) => a - b);
  const med = diffs[Math.floor(diffs.length / 2)];
  return Math.max(60, Math.round(med / 60) * 60);
}

// --- Vista de monitoreo: una consulta por tipo de dato para todos los equipos ---

function baseMulti(bucket: string, ids: string[], medicion: string): string {
  if (/["\\\n]/.test(bucket)) throw new Error("bucket invalido");
  if (!ids.length) throw new Error("sin ids");
  for (const id of ids) if (!INFLUX_ID_RE.test(id)) throw new Error("influx id invalido");
  const set = ids.map((id) => `"${id}"`).join(", ");
  return `from(bucket: "${bucket}")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "${medicion}" and contains(value: r.id, set: [${set}]))`;
}

const PIVOT = `|> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")`;

export const fluxUltimoEstado = (bucket: string, ids: string[]) =>
  `${baseMulti(bucket, ids, "estado")}\n  |> last()\n  ${PIVOT}`;

export const fluxUltimoAmbiente = (bucket: string, ids: string[]) =>
  `${baseMulti(bucket, ids, "ambiente")}\n  |> last()\n  ${PIVOT}`;

export const fluxAmbiente24h = (bucket: string, ids: string[]) =>
  `${baseMulti(bucket, ids, "ambiente")}\n  |> aggregateWindow(every: 5m, fn: mean, createEmpty: false)\n  ${PIVOT}`;

export const fluxActuadores24h = (bucket: string, ids: string[]) =>
  `${baseMulti(bucket, ids, "actuadores")}\n  |> sum()\n  |> pivot(rowKey: ["_start"], columnKey: ["_field"], valueColumn: "_value")`; // sum() descarta _time

export const fluxReinicios24h = (bucket: string, ids: string[]) =>
  `${baseMulti(bucket, ids, "estado")}
  |> filter(fn: (r) => r._field == "uptime_s")
  |> group(columns: ["id"])
  |> sort(columns: ["_time"])
  |> difference()
  |> filter(fn: (r) => r._value < 0)
  |> count()
  |> keep(columns: ["id", "_value"])`;
