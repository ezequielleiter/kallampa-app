import { differenceInCalendarDays, addDays } from "date-fns";
import type { JarEstado } from "@/models/Jar";
import type { RecipienteEstado } from "@/models/Recipiente";
import type { PlacaEstado } from "@/models/Placa";
import type { FrascoLiquidoEstado } from "@/models/FrascoLiquido";
import type { LotePill } from "@/lib/types";

/**
 * v2: ya no hay un unico Batch-documento con todas las etapas embebidas.
 * Estas funciones operan sobre listas de frascos (Jar) y recipientes
 * (Recipiente) ya traidos con `.lean()` (objetos planos, no documentos de
 * Mongoose) asociados a un batch, por eso los tipos de abajo describen la
 * forma "plana" minima que necesitamos, no el Document completo.
 */

export interface LeanOleada {
  _id?: unknown;
  fecha: Date | string;
  pesoKg: number;
  notas?: string;
}

export interface LeanJar {
  _id?: unknown;
  batchId?: unknown;
  numeroGuia: string;
  estado: JarEstado;
}

export interface LeanBatch {
  _id?: unknown;
  numeroLote: string;
  fungusTypeId: unknown;
  origenFrascoLiquidoId?: unknown;
  inoculacionGrano: {
    tipoGranoId: unknown;
    pesoGranoKg: number;
    precioPorKg: number;
    cantidadFrascos: number;
    fechaInicio: Date | string;
    diasEsperados: number;
  };
}

export interface LeanRecipiente {
  _id?: unknown;
  batchId?: unknown;
  numeroSeguimiento?: string;
  origenFrascoIds?: unknown[];
  tipoSustratoId: unknown;
  pesoSustratoKg: number;
  precioPorKg: number;
  fechaInicioIncubacion: Date | string;
  diasEsperadosIncubacion: number;
  fechaInicioFructificacion?: Date | string;
  diasEsperadosFructificacion?: number;
  estado: RecipienteEstado;
  oleadas?: LeanOleada[];
  updatedAt?: Date | string;
}

function toDate(d: Date | string | undefined | null): Date | undefined {
  if (!d) return undefined;
  return d instanceof Date ? d : new Date(d);
}

/** Dias transcurridos entre fechaInicio y fechaFin ?? hoy. */
export function diasEnEtapa(
  fechaInicio: Date | string | undefined,
  fechaFin?: Date | string
): number | null {
  const inicio = toDate(fechaInicio);
  if (!inicio) return null;
  const fin = toDate(fechaFin) ?? new Date();
  return differenceInCalendarDays(fin, inicio);
}

/** Fecha en la que una etapa "deberia terminar" (fechaInicio + diasEsperados), o null si falta algun dato. */
export function fechaEsperada(
  fechaInicio: Date | string | undefined,
  diasEsperados: number | undefined
): Date | null {
  const inicio = toDate(fechaInicio);
  if (!inicio || diasEsperados === undefined) return null;
  return addDays(inicio, diasEsperados);
}

/** Fecha de la ultima oleada de un recipiente (o undefined si no tiene). */
function ultimaOleadaFecha(recipiente: LeanRecipiente): Date | undefined {
  const fechas = (recipiente.oleadas ?? [])
    .map((o) => toDate(o.fecha))
    .filter((d): d is Date => !!d);
  if (fechas.length === 0) return undefined;
  return new Date(Math.max(...fechas.map((d) => d.getTime())));
}

/**
 * Estado del lote, 100% calculado (nunca persistido): 'en_progreso' si
 * queda algun frasco colonizando/colonizado o algun recipiente
 * incubando/fructificando, o si todavia no se creo ningun recipiente.
 * 'finalizado' solo cuando ya no queda nada activo.
 */
export function estadoLote(
  frascos: LeanJar[],
  recipientes: LeanRecipiente[]
): "en_progreso" | "finalizado" {
  const frascoActivo = frascos.some(
    (f) => f.estado === "colonizando" || f.estado === "colonizado"
  );
  const recipienteActivo = recipientes.some(
    (r) => r.estado === "incubando" || r.estado === "fructificando"
  );
  if (frascoActivo || recipienteActivo || recipientes.length === 0) return "en_progreso";
  return "finalizado";
}

/** Un frasco esta demorado si sigue 'colonizando' mas alla de lo esperado. */
export function alertaFrasco(batch: LeanBatch, frasco: LeanJar): boolean {
  if (frasco.estado !== "colonizando") return false;
  const dias = diasEnEtapa(batch.inoculacionGrano?.fechaInicio);
  return dias !== null && dias > (batch.inoculacionGrano?.diasEsperados ?? 0);
}

/** Un recipiente esta demorado si su etapa activa se paso de lo esperado. */
export function alertaRecipiente(recipiente: LeanRecipiente): boolean {
  if (recipiente.estado === "incubando") {
    const dias = diasEnEtapa(recipiente.fechaInicioIncubacion);
    return dias !== null && dias > (recipiente.diasEsperadosIncubacion ?? 0);
  }
  if (recipiente.estado === "fructificando") {
    const dias = diasEnEtapa(recipiente.fechaInicioFructificacion);
    return dias !== null && dias > (recipiente.diasEsperadosFructificacion ?? 0);
  }
  return false;
}

/** Cuantos dias de demora tiene un frasco 'colonizando' en su etapa activa (0 si no aplica). */
function overrunFrasco(batch: LeanBatch, frasco: LeanJar): number {
  if (!alertaFrasco(batch, frasco)) return 0;
  const dias = diasEnEtapa(batch.inoculacionGrano?.fechaInicio) ?? 0;
  return Math.max(0, dias - (batch.inoculacionGrano?.diasEsperados ?? 0));
}

/** Cuantos dias de demora tiene un recipiente en su etapa activa (0 si no aplica). */
function overrunRecipiente(recipiente: LeanRecipiente): number {
  if (!alertaRecipiente(recipiente)) return 0;
  if (recipiente.estado === "incubando") {
    const dias = diasEnEtapa(recipiente.fechaInicioIncubacion) ?? 0;
    return Math.max(0, dias - (recipiente.diasEsperadosIncubacion ?? 0));
  }
  const dias = diasEnEtapa(recipiente.fechaInicioFructificacion) ?? 0;
  return Math.max(0, dias - (recipiente.diasEsperadosFructificacion ?? 0));
}

/** Suma de oleadas[].pesoKg de un recipiente. */
export function pesoCosechadoRecipiente(recipiente: LeanRecipiente): number {
  return (recipiente.oleadas ?? []).reduce((acc, o) => acc + (o.pesoKg || 0), 0);
}

/**
 * Eficiencia biologica del recipiente = pesoCosechado / pesoSustratoKg * 100.
 * Devuelve null si pesoSustratoKg es 0 (evita Infinity/NaN).
 */
export function eficienciaBiologicaRecipiente(recipiente: LeanRecipiente): number | null {
  if (!recipiente.pesoSustratoKg) return null;
  return (pesoCosechadoRecipiente(recipiente) / recipiente.pesoSustratoKg) * 100;
}

/** Costo del sustrato de un recipiente. */
export function costoRecipiente(recipiente: LeanRecipiente): number {
  return (recipiente.pesoSustratoKg || 0) * (recipiente.precioPorKg || 0);
}

export interface CostoProduccion {
  costoGrano: number;
  costoSustrato: number;
  costoTotal: number;
  costoPorKgProducido: number | null;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export interface ResumenLote {
  numeroLote: string;
  estadoDerivado: "en_progreso" | "finalizado";
  diasTotales: number | null;
  pesoTotalCosechado: number;
  eficienciaBiologica: number | null;
  costoProduccion: CostoProduccion;
  alertas: number;
  // Peor demora (en dias) entre todos los frascos/recipientes con alerta
  // activa del lote. 0 si no hay ninguno demorado.
  diasDeDemora: number;
  diasIncubacionPromedio: number | null;
  diasFructificacionPromedio: number | null;
}

/**
 * Rollup de metricas de un lote a partir de sus frascos y recipientes.
 */
export function resumenLote(
  batch: LeanBatch,
  frascos: LeanJar[],
  recipientes: LeanRecipiente[]
): ResumenLote {
  const estadoDerivado = estadoLote(frascos, recipientes);

  // diasTotales: desde inoculacionGrano.fechaInicio hasta la fecha de la
  // ULTIMA oleada entre todos los recipientes, o hasta hoy si no hay
  // ninguna (o el lote sigue activo).
  const fechasUltimaOleada = recipientes
    .map((r) => ultimaOleadaFecha(r))
    .filter((d): d is Date => !!d);
  const fechaUltimaOleadaGlobal =
    fechasUltimaOleada.length > 0
      ? new Date(Math.max(...fechasUltimaOleada.map((d) => d.getTime())))
      : undefined;
  const diasTotales = diasEnEtapa(
    batch.inoculacionGrano?.fechaInicio,
    estadoDerivado === "en_progreso" ? undefined : fechaUltimaOleadaGlobal
  );

  const pesoTotalCosechado = recipientes.reduce(
    (acc, r) => acc + pesoCosechadoRecipiente(r),
    0
  );

  const sumaSustrato = recipientes.reduce((acc, r) => acc + (r.pesoSustratoKg || 0), 0);
  const eficienciaBiologica = sumaSustrato > 0 ? (pesoTotalCosechado / sumaSustrato) * 100 : null;

  const costoGrano =
    (batch.inoculacionGrano?.pesoGranoKg || 0) * (batch.inoculacionGrano?.precioPorKg || 0);
  const costoSustrato = recipientes.reduce((acc, r) => acc + costoRecipiente(r), 0);
  const costoTotal = costoGrano + costoSustrato;
  const costoProduccion: CostoProduccion = {
    costoGrano,
    costoSustrato,
    costoTotal,
    costoPorKgProducido: pesoTotalCosechado > 0 ? costoTotal / pesoTotalCosechado : null,
  };

  const alertas =
    frascos.filter((f) => alertaFrasco(batch, f)).length +
    recipientes.filter((r) => alertaRecipiente(r)).length;

  const diasDeDemora = Math.max(
    0,
    ...frascos.map((f) => overrunFrasco(batch, f)),
    ...recipientes.map((r) => overrunRecipiente(r))
  );

  const conIncubacion = recipientes.filter((r) => !!r.fechaInicioIncubacion);
  const diasIncubacionPromedio = average(
    conIncubacion.map(
      (r) => diasEnEtapa(r.fechaInicioIncubacion, r.fechaInicioFructificacion) ?? 0
    )
  );

  const conFructificacion = recipientes.filter((r) => !!r.fechaInicioFructificacion);
  const diasFructificacionPromedio = average(
    conFructificacion.map((r) => {
      const fin = r.estado === "fructificando" ? undefined : ultimaOleadaFecha(r);
      return diasEnEtapa(r.fechaInicioFructificacion, fin) ?? 0;
    })
  );

  return {
    numeroLote: batch.numeroLote,
    estadoDerivado,
    diasTotales,
    pesoTotalCosechado,
    eficienciaBiologica,
    costoProduccion,
    alertas,
    diasDeDemora,
    diasIncubacionPromedio,
    diasFructificacionPromedio,
  };
}

// --- Clonacion / Placa / FrascoLiquido ------------------------------------

export interface LeanClonacion {
  _id?: unknown;
  numeroLote: string;
  fungusTypeId: unknown;
  origenProceso?: string;
  fechaInicio?: Date | string;
  colonizacion?: {
    cantidadPlacas: number;
    fechaInicio: Date | string;
    diasEsperados: number;
  };
}

export interface LeanPlaca {
  _id?: unknown;
  clonacionId?: unknown;
  numeroPlaca: string;
  estado: PlacaEstado;
}

export interface LeanFrascoLiquido {
  _id?: unknown;
  clonacionId?: unknown;
  origenPlacaId?: unknown;
  numeroGuia: string;
  estado: FrascoLiquidoEstado;
}

/** Una placa esta demorada si sigue 'colonizando' mas alla de lo esperado. */
export function alertaPlaca(
  clonacion: LeanClonacion,
  placa: LeanPlaca
): boolean {
  if (placa.estado !== "colonizando") return false;
  const dias = diasEnEtapa(clonacion.colonizacion?.fechaInicio);
  return dias !== null && dias > (clonacion.colonizacion?.diasEsperados ?? 0);
}

export interface ResumenClonacion {
  placasColonizando: number;
  placasColonizado: number;
  placasContaminado: number;
  frascosLiquidosValidos: number;
  frascosLiquidosVacios: number;
  frascosLiquidosFinalizados: number;
  frascosLiquidosContaminados: number;
  alertas: number;
}

/** Rollup de metricas de una clonacion a partir de sus placas y frascos liquidos. */
export function resumenClonacion(
  clonacion: LeanClonacion,
  placas: LeanPlaca[],
  frascosLiquidos: LeanFrascoLiquido[]
): ResumenClonacion {
  return {
    placasColonizando: placas.filter((p) => p.estado === "colonizando").length,
    placasColonizado: placas.filter((p) => p.estado === "colonizado").length,
    placasContaminado: placas.filter((p) => p.estado === "contaminado").length,
    frascosLiquidosValidos: frascosLiquidos.filter((f) => f.estado === "valido").length,
    frascosLiquidosVacios: frascosLiquidos.filter((f) => f.estado === "vacio").length,
    frascosLiquidosFinalizados: frascosLiquidos.filter((f) => f.estado === "finalizado").length,
    frascosLiquidosContaminados: frascosLiquidos.filter((f) => f.estado === "contaminado").length,
    alertas: placas.filter((p) => alertaPlaca(clonacion, p)).length,
  };
}

// --- agregados por catalogo ----------------------------------------------

export type CatalogoCampo = "fungusTypeId" | "tipoGranoId" | "tipoSustratoId";

export interface AgregadoCatalogo {
  key: string;
  label: string;
  // Cantidad de lotes agrupados (fungusTypeId/tipoGranoId) o de recipientes
  // (tipoSustratoId) -- el nombre se mantiene por compatibilidad con el
  // formato que ya consume el frontend de /api/stats.
  cantidadLotes: number;
  eficienciaBiologicaPromedio: number | null;
  diasTotalesPromedio: number | null;
  costoPorKgPromedio: number | null;
}

function idToString(id: unknown): string | null {
  if (!id) return null;
  if (typeof id === "string") return id;
  if (typeof id === "object" && id !== null) {
    // BSON/Mongoose ObjectId: chequear esto ANTES que `_id` generico, porque
    // mongoose.Types.ObjectId expone un getter `_id` que devuelve el mismo
    // ObjectId (para interoperar con populate) y entrar por la rama de
    // "documento poblado" de abajo causaria recursion infinita.
    const maybeObjectId = id as { _bsontype?: string; toHexString?: () => string };
    if (maybeObjectId._bsontype === "ObjectId" && typeof maybeObjectId.toHexString === "function") {
      return maybeObjectId.toHexString();
    }

    // Documento poblado (lean): objeto plano con su propio _id distinto.
    const anyId = id as { _id?: unknown; toString?: () => string };
    if (anyId._id) return idToString(anyId._id);
    if (typeof anyId.toString === "function") return anyId.toString();
  }
  return String(id);
}

function labelFor(id: unknown, fallback: string): string {
  if (id && typeof id === "object") {
    const populated = id as { nombre?: string };
    if (populated.nombre) return populated.nombre;
  }
  return fallback;
}

export interface LoteConDatos {
  batch: LeanBatch;
  frascos: LeanJar[];
  recipientes: LeanRecipiente[];
}

/** Agrupa lotes FINALIZADOS (estadoDerivado) por fungusTypeId o tipoGranoId. */
function agregarLotesPorCatalogo(
  lotes: LoteConDatos[],
  campo: "fungusTypeId" | "tipoGranoId"
): AgregadoCatalogo[] {
  const finalizados = lotes.filter(
    (l) => estadoLote(l.frascos, l.recipientes) === "finalizado"
  );

  const grupos = new Map<
    string,
    { label: string; eb: number[]; dias: number[]; costoKg: number[]; cantidad: number }
  >();

  for (const { batch, frascos, recipientes } of finalizados) {
    const rawId = campo === "fungusTypeId" ? batch.fungusTypeId : batch.inoculacionGrano?.tipoGranoId;
    const key = idToString(rawId);
    if (!key) continue;

    if (!grupos.has(key)) {
      grupos.set(key, { label: labelFor(rawId, key), eb: [], dias: [], costoKg: [], cantidad: 0 });
    }
    const grupo = grupos.get(key)!;
    grupo.cantidad += 1;

    const resumen = resumenLote(batch, frascos, recipientes);
    if (resumen.eficienciaBiologica !== null) grupo.eb.push(resumen.eficienciaBiologica);
    if (resumen.diasTotales !== null) grupo.dias.push(resumen.diasTotales);
    if (resumen.costoProduccion.costoPorKgProducido !== null) {
      grupo.costoKg.push(resumen.costoProduccion.costoPorKgProducido);
    }
  }

  return Array.from(grupos.entries()).map(([key, grupo]) => ({
    key,
    label: grupo.label,
    cantidadLotes: grupo.cantidad,
    eficienciaBiologicaPromedio: average(grupo.eb),
    diasTotalesPromedio: average(grupo.dias),
    costoPorKgPromedio: average(grupo.costoKg),
  }));
}

/**
 * Agrupa recipientes FINALIZADOS por tipoSustratoId, cruzando todos los
 * lotes (cada recipiente aporta su propia eficiencia/costo al grupo de su
 * tipo de sustrato, no el lote entero).
 */
function agregarRecipientesPorSustrato(recipientes: LeanRecipiente[]): AgregadoCatalogo[] {
  const finalizados = recipientes.filter((r) => r.estado === "finalizado");

  const grupos = new Map<
    string,
    { label: string; eb: number[]; dias: number[]; costoKg: number[]; cantidad: number }
  >();

  for (const recipiente of finalizados) {
    const key = idToString(recipiente.tipoSustratoId);
    if (!key) continue;

    if (!grupos.has(key)) {
      grupos.set(key, {
        label: labelFor(recipiente.tipoSustratoId, key),
        eb: [],
        dias: [],
        costoKg: [],
        cantidad: 0,
      });
    }
    const grupo = grupos.get(key)!;
    grupo.cantidad += 1;

    const eb = eficienciaBiologicaRecipiente(recipiente);
    if (eb !== null) grupo.eb.push(eb);

    const fin = ultimaOleadaFecha(recipiente);
    const dias = diasEnEtapa(recipiente.fechaInicioIncubacion, fin);
    if (dias !== null) grupo.dias.push(dias);

    const peso = pesoCosechadoRecipiente(recipiente);
    const costoPorKg = peso > 0 ? costoRecipiente(recipiente) / peso : null;
    if (costoPorKg !== null) grupo.costoKg.push(costoPorKg);
  }

  return Array.from(grupos.entries()).map(([key, grupo]) => ({
    key,
    label: grupo.label,
    cantidadLotes: grupo.cantidad,
    eficienciaBiologicaPromedio: average(grupo.eb),
    diasTotalesPromedio: average(grupo.dias),
    costoPorKgPromedio: average(grupo.costoKg),
  }));
}

/**
 * Punto de entrada unico para los 3 agregados de catalogo de /api/stats.
 * "por hongo" y "por grano" agrupan lotes finalizados (via `lotes`);
 * "por sustrato" agrupa recipientes finalizados a nivel individual (via
 * `recipientesTodos`), cruzando todos los lotes.
 */
export function agregarPorCatalogo(
  campo: CatalogoCampo,
  lotes: LoteConDatos[],
  recipientesTodos: LeanRecipiente[]
): AgregadoCatalogo[] {
  if (campo === "tipoSustratoId") {
    return agregarRecipientesPorSustrato(recipientesTodos);
  }
  return agregarLotesPorCatalogo(lotes, campo);
}

// --- Calendario (pills automaticos de lote/clonacion) ---------------------
//
// Un "pill" indica que una etapa del dominio "deberia terminar" en una
// fecha (fechaInicio + diasEsperados de esa etapa), calculada 100% al
// vuelo -- nunca se persiste nada. Se oculta apenas la etapa ya termino,
// por eso las queries que alimentan esta funcion (ver
// src/app/api/calendario/route.ts) ya filtran por el estado "activo" de
// cada etapa (jar/placa "colonizando", recipiente "incubando"/
// "fructificando") antes de llegar aca.

function pillEnRango(fecha: Date | null, desde: Date, hasta: Date): boolean {
  return fecha !== null && fecha >= desde && fecha < hasta;
}

export interface LotePillsPendientesParams {
  jarsColonizando: Pick<LeanJar, "batchId">[];
  batches: LeanBatch[];
  recipientesIncubando: LeanRecipiente[];
  recipientesFructificando: LeanRecipiente[];
  placasColonizando: Pick<LeanPlaca, "clonacionId">[];
  clonaciones: LeanClonacion[];
  desde: Date;
  hasta: Date; // [desde, hasta) del mes pedido
}

/**
 * Arma los 4 tipos de pill del Calendario a partir de datos ya traidos de
 * Mongo (no hace queries): un pill por batch con algun jar "colonizando"
 * (grano), uno por recipiente "incubando"/"fructificando", y uno por
 * clonacion (origen "placa") con alguna placa "colonizando". Filtra el
 * resultado a los que caen en `[desde, hasta)`.
 */
export function lotePillsPendientes(params: LotePillsPendientesParams): LotePill[] {
  const {
    jarsColonizando,
    batches,
    recipientesIncubando,
    recipientesFructificando,
    placasColonizando,
    clonaciones,
    desde,
    hasta,
  } = params;

  const pills: LotePill[] = [];

  const batchIdsColonizando = new Set(jarsColonizando.map((j) => idToString(j.batchId)));
  for (const batch of batches) {
    if (!batchIdsColonizando.has(idToString(batch._id))) continue;
    const fecha = fechaEsperada(batch.inoculacionGrano?.fechaInicio, batch.inoculacionGrano?.diasEsperados);
    if (!pillEnRango(fecha, desde, hasta)) continue;
    pills.push({
      tipo: "grano",
      fechaEsperada: fecha!.toISOString(),
      codigo: batch.numeroLote,
      href: `/lotes/${idToString(batch._id)}`,
    });
  }

  for (const recipiente of recipientesIncubando) {
    const fecha = fechaEsperada(recipiente.fechaInicioIncubacion, recipiente.diasEsperadosIncubacion);
    if (!pillEnRango(fecha, desde, hasta)) continue;
    pills.push({
      tipo: "incubacion",
      fechaEsperada: fecha!.toISOString(),
      codigo: recipiente.numeroSeguimiento ?? "",
      href: `/lotes/${idToString(recipiente.batchId)}`,
    });
  }

  for (const recipiente of recipientesFructificando) {
    const fecha = fechaEsperada(recipiente.fechaInicioFructificacion, recipiente.diasEsperadosFructificacion);
    if (!pillEnRango(fecha, desde, hasta)) continue;
    pills.push({
      tipo: "fructificacion",
      fechaEsperada: fecha!.toISOString(),
      codigo: recipiente.numeroSeguimiento ?? "",
      href: `/lotes/${idToString(recipiente.batchId)}`,
    });
  }

  const clonacionIdsColonizando = new Set(placasColonizando.map((p) => idToString(p.clonacionId)));
  for (const clonacion of clonaciones) {
    if (!clonacionIdsColonizando.has(idToString(clonacion._id))) continue;
    const fecha = fechaEsperada(clonacion.colonizacion?.fechaInicio, clonacion.colonizacion?.diasEsperados);
    if (!pillEnRango(fecha, desde, hasta)) continue;
    pills.push({
      tipo: "placas",
      fechaEsperada: fecha!.toISOString(),
      codigo: clonacion.numeroLote,
      href: `/clonacion/${idToString(clonacion._id)}`,
    });
  }

  return pills;
}
