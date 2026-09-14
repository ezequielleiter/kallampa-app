// Utilidades compartidas por los tests de integracion de los route
// handlers de src/app/api/**. No es un archivo *.test.ts, asi que Vitest
// no lo recolecta como suite propia.
import { NextRequest } from "next/server";

// `P` es la forma real de `params` que declara cada route handler (ej.
// `{ id: string }` o `{ id: string; oleadaId: string }`). Generico para que
// TS infiera el shape correcto handler por handler en vez de forzar un
// `Record<string, string>` generico que no matchea las firmas concretas.
type RouteHandler<P extends Record<string, string>> = (
  req: NextRequest,
  ctx: { params: Promise<P> }
) => Promise<Response>;

interface CallOpts {
  method?: string;
  url?: string;
  body?: unknown;
  params?: Record<string, string>;
  searchParams?: Record<string, string>;
}

/**
 * Invoca un route handler de Next App Router directamente (sin levantar un
 * servidor real) y devuelve el status + body ya parseado como JSON.
 */
export async function callRoute<P extends Record<string, string> = Record<string, string>>(
  handler: RouteHandler<P>,
  opts: CallOpts = {}
) {
  const { method = "GET", body, params = {}, searchParams } = opts;
  let url = opts.url ?? "http://localhost/api/test";
  if (searchParams) {
    const u = new URL(url);
    for (const [k, v] of Object.entries(searchParams)) u.searchParams.set(k, v);
    url = u.toString();
  }

  const req = new NextRequest(url, {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: body !== undefined ? { "content-type": "application/json" } : undefined,
  });

  const res = await handler(req, { params: Promise.resolve(params as P) });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

// v2: 3 campos (inoculacionGrano/incubacion/fructificacion) -- "cosecha" ya
// no aplica como default fijo de dias esperados.
const DEFAULT_DIAS_ESPERADOS = {
  inoculacionGrano: 14,
  incubacion: 20,
  fructificacion: 10,
};

export async function makeFungusType(overrides: Record<string, unknown> = {}) {
  const { POST } = await import("@/app/api/fungus-types/route");
  const { status, json } = await callRoute(POST, {
    method: "POST",
    body: {
      nombre: `Hongo Test ${Math.random().toString(36).slice(2)}`,
      diasEsperadosDefault: DEFAULT_DIAS_ESPERADOS,
      ...overrides,
    },
  });
  if (status !== 201) {
    throw new Error(`No se pudo crear fungusType de fixture: ${JSON.stringify(json)}`);
  }
  return json.data as { _id: string; nombre: string; diasEsperadosDefault: typeof DEFAULT_DIAS_ESPERADOS };
}

export async function makeGrainType(overrides: Record<string, unknown> = {}) {
  const { POST } = await import("@/app/api/grain-types/route");
  const { status, json } = await callRoute(POST, {
    method: "POST",
    body: { nombre: `Grano Test ${Math.random().toString(36).slice(2)}`, ...overrides },
  });
  if (status !== 201) {
    throw new Error(`No se pudo crear grainType de fixture: ${JSON.stringify(json)}`);
  }
  return json.data as { _id: string; nombre: string };
}

export async function makeSubstrateType(overrides: Record<string, unknown> = {}) {
  const { POST } = await import("@/app/api/substrate-types/route");
  const { status, json } = await callRoute(POST, {
    method: "POST",
    body: { nombre: `Sustrato Test ${Math.random().toString(36).slice(2)}`, ...overrides },
  });
  if (status !== 201) {
    throw new Error(`No se pudo crear substrateType de fixture: ${JSON.stringify(json)}`);
  }
  return json.data as { _id: string; nombre: string };
}

export interface MakeBatchOpts {
  fungusTypeId?: string;
  tipoGranoId?: string;
  pesoGranoKg?: number;
  precioPorKg?: number;
  cantidadFrascos?: number;
  fechaInicio?: string;
  diasEsperados?: number;
}

/** Crea fungusType + grainType de soporte si no se pasan, y crea el batch (+ sus jars). */
export async function makeBatch(opts: MakeBatchOpts = {}) {
  const { POST } = await import("@/app/api/batches/route");

  const fungusTypeId = opts.fungusTypeId ?? (await makeFungusType())._id;
  const tipoGranoId = opts.tipoGranoId ?? (await makeGrainType())._id;

  const { status, json } = await callRoute(POST, {
    method: "POST",
    body: {
      fungusTypeId,
      tipoGranoId,
      pesoGranoKg: opts.pesoGranoKg ?? 10,
      precioPorKg: opts.precioPorKg ?? 500,
      cantidadFrascos: opts.cantidadFrascos ?? 3,
      fechaInicio: opts.fechaInicio ?? new Date().toISOString(),
      ...(opts.diasEsperados !== undefined ? { diasEsperados: opts.diasEsperados } : {}),
    },
  });
  if (status !== 201) {
    throw new Error(`No se pudo crear batch de fixture: ${JSON.stringify(json)}`);
  }
  return json.data;
}

/** Marca N jars de un batch (ya creado) como 'colonizado' y devuelve sus ids. */
export async function colonizarJars(jars: { _id: string }[]) {
  const { PATCH } = await import("@/app/api/jars/[id]/route");
  for (const jar of jars) {
    await callRoute(PATCH, {
      method: "PATCH",
      params: { id: jar._id },
      body: { estado: "colonizado" },
    });
  }
  return jars.map((j) => j._id);
}

export interface MakeRecipienteOpts {
  batchId: string;
  origenFrascoIds: string[];
  tipoSustratoId?: string;
  pesoSustratoKg?: number;
  precioPorKg?: number;
  fechaInicioIncubacion?: string;
  diasEsperadosIncubacion?: number;
}

/** Crea un recipiente a partir de frascos ya colonizados de un batch. */
export async function makeRecipiente(opts: MakeRecipienteOpts) {
  const { POST } = await import("@/app/api/recipientes/route");
  const tipoSustratoId = opts.tipoSustratoId ?? (await makeSubstrateType())._id;

  const { status, json } = await callRoute(POST, {
    method: "POST",
    body: {
      batchId: opts.batchId,
      origenFrascoIds: opts.origenFrascoIds,
      tipoSustratoId,
      pesoSustratoKg: opts.pesoSustratoKg ?? 20,
      precioPorKg: opts.precioPorKg ?? 100,
      fechaInicioIncubacion: opts.fechaInicioIncubacion ?? new Date().toISOString(),
      ...(opts.diasEsperadosIncubacion !== undefined
        ? { diasEsperadosIncubacion: opts.diasEsperadosIncubacion }
        : {}),
    },
  });
  if (status !== 201) {
    throw new Error(`No se pudo crear recipiente de fixture: ${JSON.stringify(json)}`);
  }
  return json.data;
}

/** Crea un batch con 1 frasco ya colonizado y un recipiente a partir de el. */
export async function makeBatchConRecipiente(opts: MakeBatchOpts = {}) {
  const batch = await makeBatch({ cantidadFrascos: 1, ...opts });
  const [jarId] = await colonizarJars(batch.jars);
  const recipiente = await makeRecipiente({ batchId: batch._id, origenFrascoIds: [jarId] });
  return { batch, recipiente };
}

/** Hace fructificar un recipiente ya creado (debe estar 'incubando'). */
export async function fructificarRecipiente(
  recipienteId: string,
  overrides: Record<string, unknown> = {}
) {
  const { POST } = await import("@/app/api/recipientes/[id]/fructificar/route");
  const { status, json } = await callRoute(POST, {
    method: "POST",
    params: { id: recipienteId },
    body: { fechaInicioFructificacion: new Date().toISOString(), ...overrides },
  });
  if (status !== 200) {
    throw new Error(`No se pudo fructificar el recipiente de fixture: ${JSON.stringify(json)}`);
  }
  return json.data;
}
