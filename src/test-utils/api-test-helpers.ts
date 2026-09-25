// Utilidades compartidas por los tests de integracion de los route
// handlers de src/app/api/**. No es un archivo *.test.ts, asi que Vitest
// no lo recolecta como suite propia.
import { NextRequest } from "next/server";
import { hashPassword, generateApiKey, signSessionToken } from "@/lib/auth";
import User from "@/models/User";

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
  headers?: Record<string, string>;
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
    headers: {
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...(opts.headers ?? {}),
    },
  });

  const res = await handler(req, { params: Promise.resolve(params as P) });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

/**
 * Crea un User real (via el modelo, no via la route de registro -- mas
 * simple y no pasa por Zod) para usar como dueno de los fixtures de un
 * test. Devuelve el doc con los datos necesarios para armar `authHeaders`.
 * Nadie se loguea con password en estos tests (solo con headers), asi que
 * no hace falta devolverla.
 */
export async function makeUser(overrides: Record<string, unknown> = {}) {
  const rand = Math.random().toString(36).slice(2);
  const doc = {
    username: `user${rand}`,
    email: `user${rand}@test.local`,
    passwordHash: await hashPassword("Test1234!"),
    apiKey: generateApiKey(),
    ...overrides,
  };
  const user = await User.create(doc);
  return {
    _id: String(user._id),
    username: user.username as string,
    email: user.email as string,
    apiKey: doc.apiKey as string,
  };
}

/** Arma los headers de auth (x-api-key + JWT de sesion) que exige requireAuth. */
export function authHeaders(user: { _id: string; apiKey: string }): Record<string, string> {
  const token = signSessionToken(String(user._id));
  return { "x-api-key": user.apiKey, Authorization: `Bearer ${token}` };
}

/**
 * Todos los factories `makeX`/helpers de fixtures de este archivo requieren
 * `userId` + `headers` (armados con `authHeaders(user)`) para saber a que
 * cuenta pertenece lo que crean/modifican -- sin default, a proposito: cada
 * test tiene que crear su(s) `makeUser()` explicitamente.
 * `userId` no siempre hace falta dentro del propio factory (el dueno real
 * lo determina `requireAuth` a partir de los headers), pero se pide
 * igual por consistencia: various factories anidados lo re-propagan a
 * otros factories, y los tests lo usan para armar/verificar cross-user.
 * Cuando un factory no lo necesita direccamente, igual viaja en el `body`
 * del POST -- los schemas de Zod ignoran claves desconocidas, así que no
 * rompe nada.
 */
export interface AuthOpts {
  userId: string;
  headers: Record<string, string>;
}

// v2: 3 campos (inoculacionGrano/incubacion/fructificacion) -- "cosecha" ya
// no aplica como default fijo de dias esperados.
const DEFAULT_DIAS_ESPERADOS = {
  inoculacionGrano: 14,
  incubacion: 20,
  fructificacion: 10,
};

export async function makeFungusType(opts: AuthOpts & Record<string, unknown>) {
  const { headers, ...rest } = opts;
  const { POST } = await import("@/app/api/fungus-types/route");
  const { status, json } = await callRoute(POST, {
    method: "POST",
    headers,
    body: {
      nombre: `Hongo Test ${Math.random().toString(36).slice(2)}`,
      diasEsperadosDefault: DEFAULT_DIAS_ESPERADOS,
      ...rest,
    },
  });
  if (status !== 201) {
    throw new Error(`No se pudo crear fungusType de fixture: ${JSON.stringify(json)}`);
  }
  return json.data as { _id: string; nombre: string; diasEsperadosDefault: typeof DEFAULT_DIAS_ESPERADOS };
}

export async function makeGrainType(opts: AuthOpts & Record<string, unknown>) {
  const { headers, ...rest } = opts;
  const { POST } = await import("@/app/api/grain-types/route");
  const { status, json } = await callRoute(POST, {
    method: "POST",
    headers,
    body: { nombre: `Grano Test ${Math.random().toString(36).slice(2)}`, ...rest },
  });
  if (status !== 201) {
    throw new Error(`No se pudo crear grainType de fixture: ${JSON.stringify(json)}`);
  }
  return json.data as { _id: string; nombre: string };
}

export async function makeSubstrateType(opts: AuthOpts & Record<string, unknown>) {
  const { headers, ...rest } = opts;
  const { POST } = await import("@/app/api/substrate-types/route");
  const { status, json } = await callRoute(POST, {
    method: "POST",
    headers,
    body: { nombre: `Sustrato Test ${Math.random().toString(36).slice(2)}`, ...rest },
  });
  if (status !== 201) {
    throw new Error(`No se pudo crear substrateType de fixture: ${JSON.stringify(json)}`);
  }
  return json.data as { _id: string; nombre: string };
}

export interface MakeBatchOpts extends AuthOpts {
  fungusTypeId?: string;
  origenFrascoLiquidoId?: string;
  tipoGranoId?: string;
  pesoGranoKg?: number;
  precioPorKg?: number;
  cantidadFrascos?: number;
  fechaInicio?: string;
  diasEsperados?: number;
}

/**
 * Crea fungusType + grainType de soporte si no se pasan, y crea el batch
 * (+ sus jars). El lote se puede iniciar con un `fungusTypeId` directo (por
 * default) o con `origenFrascoLiquidoId` (el hongo se deriva del frasco) --
 * si se pasa este ultimo, NO se autocompleta fungusTypeId.
 */
export async function makeBatch(opts: MakeBatchOpts) {
  const { userId, headers } = opts;
  const { POST } = await import("@/app/api/batches/route");

  const fungusTypeId =
    opts.fungusTypeId ??
    (opts.origenFrascoLiquidoId ? undefined : (await makeFungusType({ userId, headers }))._id);
  const tipoGranoId = opts.tipoGranoId ?? (await makeGrainType({ userId, headers }))._id;

  const { status, json } = await callRoute(POST, {
    method: "POST",
    headers,
    body: {
      ...(fungusTypeId ? { fungusTypeId } : {}),
      ...(opts.origenFrascoLiquidoId ? { origenFrascoLiquidoId: opts.origenFrascoLiquidoId } : {}),
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
export async function colonizarJars(jars: { _id: string }[], opts: AuthOpts) {
  const { PATCH } = await import("@/app/api/jars/[id]/route");
  for (const jar of jars) {
    await callRoute(PATCH, {
      method: "PATCH",
      headers: opts.headers,
      params: { id: jar._id },
      body: { estado: "colonizado" },
    });
  }
  return jars.map((j) => j._id);
}

export interface MakeRecipienteOpts extends AuthOpts {
  batchId: string;
  origenFrascoIds: string[];
  tipoSustratoId?: string;
  pesoSustratoKg?: number;
  precioPorKg?: number;
  fechaInicioIncubacion?: string;
  diasEsperadosIncubacion?: number;
}

/** Crea un recipiente a partir de uno o mas frascos de grano ya colonizados (Jar). */
export async function makeRecipiente(opts: MakeRecipienteOpts) {
  const { userId, headers } = opts;
  const { POST } = await import("@/app/api/recipientes/route");
  const tipoSustratoId = opts.tipoSustratoId ?? (await makeSubstrateType({ userId, headers }))._id;

  const { status, json } = await callRoute(POST, {
    method: "POST",
    headers,
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
export async function makeBatchConRecipiente(opts: MakeBatchOpts) {
  const { userId, headers } = opts;
  const batch = await makeBatch({ cantidadFrascos: 1, ...opts });
  const [jarId] = await colonizarJars(batch.jars, { userId, headers });
  const recipiente = await makeRecipiente({ userId, headers, batchId: batch._id, origenFrascoIds: [jarId] });
  return { batch, recipiente };
}

/** Hace fructificar un recipiente ya creado (debe estar 'incubando'). */
export async function fructificarRecipiente(
  recipienteId: string,
  opts: AuthOpts & Record<string, unknown>
) {
  const { headers, ...rest } = opts;
  const { POST } = await import("@/app/api/recipientes/[id]/fructificar/route");
  const { status, json } = await callRoute(POST, {
    method: "POST",
    headers,
    params: { id: recipienteId },
    body: { fechaInicioFructificacion: new Date().toISOString(), ...rest },
  });
  if (status !== 200) {
    throw new Error(`No se pudo fructificar el recipiente de fixture: ${JSON.stringify(json)}`);
  }
  return json.data;
}

export interface MakeClonacionOpts extends AuthOpts {
  fungusTypeId?: string;
  origenJarId?: string;
  origenRecipienteId?: string;
  cantidadPlacas?: number;
  fechaInicio?: string;
  diasEsperados?: number;
  origenProceso?: "placa" | "comprado" | "frascoGrano";
  cantidadFrascos?: number;
}

/**
 * Crea un fungusType (con colonizacionPlacas por default) si no se pasa
 * ninguna fuente de hongo, y crea la clonacion (+ sus placas). La
 * clonacion se puede iniciar con un `fungusTypeId` directo (por default),
 * o con `origenJarId`/`origenRecipienteId` (el hongo se deriva del lote de
 * origen) -- si se pasa alguno de estos, NO se autocompleta fungusTypeId.
 */
export async function makeClonacion(opts: MakeClonacionOpts) {
  const { userId, headers } = opts;
  const { POST } = await import("@/app/api/clonaciones/route");

  const tieneOrigen = !!(opts.origenJarId || opts.origenRecipienteId);
  const fungusTypeId =
    opts.fungusTypeId ??
    (tieneOrigen
      ? undefined
      : (
          await makeFungusType({
            userId,
            headers,
            diasEsperadosDefault: { ...DEFAULT_DIAS_ESPERADOS, colonizacionPlacas: 15 },
          })
        )._id);

  const { status, json } = await callRoute(POST, {
    method: "POST",
    headers,
    body: {
      ...(fungusTypeId ? { fungusTypeId } : {}),
      ...(opts.origenJarId ? { origenJarId: opts.origenJarId } : {}),
      ...(opts.origenRecipienteId ? { origenRecipienteId: opts.origenRecipienteId } : {}),
      cantidadPlacas: opts.cantidadPlacas ?? 3,
      fechaInicio: opts.fechaInicio ?? new Date().toISOString(),
      ...(opts.diasEsperados !== undefined ? { diasEsperados: opts.diasEsperados } : {}),
      ...(opts.origenProceso ? { origenProceso: opts.origenProceso } : {}),
      ...(opts.cantidadFrascos !== undefined ? { cantidadFrascos: opts.cantidadFrascos } : {}),
    },
  });
  if (status !== 201) {
    throw new Error(`No se pudo crear clonacion de fixture: ${JSON.stringify(json)}`);
  }
  return json.data;
}

export interface MakeClonacionDirectaOpts extends AuthOpts {
  origenProceso: "comprado" | "frascoGrano";
  origenJarId?: string;
  fungusTypeId?: string;
  cantidadFrascos?: number;
  fechaInicio?: Date;
}

/**
 * Crea una clonacion por uno de los 2 caminos "directos" (sin placas):
 * "comprado" (requiere fungusTypeId, sin origen interno) o "frascoGrano"
 * (requiere origenJarId, el hongo se hereda del jar). A diferencia de
 * `makeClonacion`, no autocompleta un fungusType/jar de soporte -- quien
 * llama decide que fuente pasar segun el camino elegido.
 */
export async function makeClonacionDirecta(opts: MakeClonacionDirectaOpts) {
  const { headers } = opts;
  const { POST } = await import("@/app/api/clonaciones/route");

  const { status, json } = await callRoute(POST, {
    method: "POST",
    headers,
    body: {
      origenProceso: opts.origenProceso,
      ...(opts.fungusTypeId ? { fungusTypeId: opts.fungusTypeId } : {}),
      ...(opts.origenJarId ? { origenJarId: opts.origenJarId } : {}),
      cantidadFrascos: opts.cantidadFrascos ?? 3,
      fechaInicio: (opts.fechaInicio ?? new Date()).toISOString(),
    },
  });
  if (status !== 201) {
    throw new Error(`No se pudo crear clonacion directa de fixture: ${JSON.stringify(json)}`);
  }
  return json.data;
}

/** Marca N placas de una clonacion (ya creada) como 'colonizado' y devuelve sus ids. */
export async function colonizarPlacas(placas: { _id: string }[], opts: AuthOpts) {
  const { PATCH } = await import("@/app/api/placas/[id]/route");
  for (const placa of placas) {
    await callRoute(PATCH, {
      method: "PATCH",
      headers: opts.headers,
      params: { id: placa._id },
      body: { estado: "colonizado" },
    });
  }
  return placas.map((p) => p._id);
}

export async function colonizarFrascosLiquidos(frascos: { _id: string }[], opts: AuthOpts) {
  const { PATCH } = await import("@/app/api/frascos-liquidos/[id]/route");
  for (const frasco of frascos) {
    await callRoute(PATCH, {
      method: "PATCH",
      headers: opts.headers,
      params: { id: frasco._id },
      body: { estado: "colonizado" },
    });
  }
  return frascos.map((f) => f._id);
}

export interface MakeFrascoLiquidoOpts extends AuthOpts {
  origenPlacaId: string;
  fechaCreacion?: string;
}

export async function makeTarea(opts: AuthOpts & Record<string, unknown>) {
  const { headers, ...rest } = opts;
  const { POST } = await import("@/app/api/tareas/route");
  const { status, json } = await callRoute(POST, {
    method: "POST",
    headers,
    body: { titulo: "Tarea de prueba", fecha: new Date(), estado: "pendiente", ...rest },
  });
  if (status !== 201) {
    throw new Error(`No se pudo crear tarea de fixture: ${JSON.stringify(json)}`);
  }
  return json.data as { _id: string; titulo: string; fecha: string; estado: string };
}

/** Crea un frasco liquido a partir de una placa ya colonizada. */
export async function makeFrascoLiquido(opts: MakeFrascoLiquidoOpts) {
  const { POST } = await import("@/app/api/frascos-liquidos/route");
  const { status, json } = await callRoute(POST, {
    method: "POST",
    headers: opts.headers,
    body: {
      origenPlacaId: opts.origenPlacaId,
      fechaCreacion: opts.fechaCreacion ?? new Date().toISOString(),
    },
  });
  if (status !== 201) {
    throw new Error(`No se pudo crear frasco liquido de fixture: ${JSON.stringify(json)}`);
  }
  return json.data;
}

export async function makeInvernadero(opts: AuthOpts & Record<string, unknown>) {
  const { headers, ...rest } = opts;
  const { POST } = await import("@/app/api/invernaderos/route");
  const { status, json } = await callRoute(POST, {
    method: "POST",
    headers,
    body: {
      nombre: `Carpa Test ${Math.random().toString(36).slice(2)}`,
      altoM: 2.5,
      largoM: 6,
      profundidadM: 3,
      ...rest,
    },
  });
  if (status !== 201) {
    throw new Error(`No se pudo crear invernadero de fixture: ${JSON.stringify(json)}`);
  }
  return json.data as {
    _id: string;
    nombre: string;
    altoM: number;
    largoM: number;
    profundidadM: number;
    activo: boolean;
  };
}
