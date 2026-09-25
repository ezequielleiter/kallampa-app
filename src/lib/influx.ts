// Cliente minimo de InfluxDB 2.x (API v2) — SOLO SERVIDOR.
//
// Lo importan unicamente las API routes (src/app/api/**). Nunca importarlo
// desde un Client Component: el token vive en `process.env.INFLUX_TOKEN` y
// no debe llegar al navegador ni a los logs. Los errores que se propagan
// usan codigos del proyecto y nunca incluyen el token ni la respuesta cruda.
import { ApiError } from "@/lib/api-utils";

export interface InfluxConfig {
  url: string;
  org: string;
  bucket: string;
  token: string;
}

const TIMEOUT_MS = 15_000;

export function getInfluxConfig(): InfluxConfig {
  const url = process.env.INFLUX_URL?.trim();
  const org = process.env.INFLUX_ORG?.trim();
  const bucket = process.env.INFLUX_BUCKET?.trim();
  const token = process.env.INFLUX_TOKEN?.trim();
  if (!url || !org || !bucket || !token) {
    throw new ApiError(
      "influx_no_configurado:El monitoreo no está configurado (faltan las variables INFLUX_*)",
      503
    );
  }
  return { url: url.replace(/\/+$/, ""), org, bucket, token };
}

/** Ejecuta una consulta Flux y devuelve las filas del CSV como objetos por nombre de columna. */
export async function runFlux(
  flux: string,
  config: InfluxConfig = getInfluxConfig()
): Promise<Record<string, string | null>[]> {
  let res: Response;
  try {
    res = await fetch(`${config.url}/api/v2/query?org=${encodeURIComponent(config.org)}`, {
      method: "POST",
      headers: {
        Authorization: `Token ${config.token}`,
        "Content-Type": "application/json",
        Accept: "application/csv",
      },
      body: JSON.stringify({ query: flux, dialect: { annotations: [], header: true } }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "influx_sin_conexion:No se pudo conectar con InfluxDB. Revisá INFLUX_URL y la conexión.",
      502
    );
  }

  if (res.status === 401 || res.status === 403) {
    throw new ApiError(
      "influx_sin_permiso:El token de InfluxDB no tiene permiso de lectura sobre el bucket",
      502
    );
  }
  if (!res.ok) {
    throw new ApiError(`influx_error:InfluxDB respondió con un error (HTTP ${res.status})`, 502);
  }
  return parseFluxCsv(await res.text());
}

/**
 * Parsea el CSV de Influx: puede traer varios bloques separados por una linea
 * en blanco, cada uno con su propio encabezado. Se lee por nombre de columna;
 * una celda vacia queda como null.
 */
export function parseFluxCsv(text: string): Record<string, string | null>[] {
  const out: Record<string, string | null>[] = [];
  const bloques = text.replace(/\r\n/g, "\n").split(/\n\s*\n/);
  for (const bloque of bloques) {
    const lineas = bloque.split("\n").filter((l) => l.trim() !== "");
    if (lineas.length < 2) continue;
    const header = splitCsvLine(lineas[0]);
    for (const linea of lineas.slice(1)) {
      const celdas = splitCsvLine(linea);
      const row: Record<string, string | null> = {};
      header.forEach((col, i) => {
        if (!col) return;
        const v = celdas[i];
        row[col] = v === undefined || v === "" ? null : v;
      });
      out.push(row);
    }
  }
  return out;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}
