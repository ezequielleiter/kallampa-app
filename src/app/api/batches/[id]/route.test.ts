import { describe, it, expect, beforeEach } from "vitest";
import { GET, PATCH } from "./route";
import Batch from "@/models/Batch";
import Jar from "@/models/Jar";
import Recipiente from "@/models/Recipiente";
import {
  callRoute,
  makeBatch,
  makeFungusType,
  colonizarJars,
  makeRecipiente,
  makeClonacion,
  makeClonacionDirecta,
  colonizarPlacas,
  colonizarFrascosLiquidos,
  makeFrascoLiquido,
  makeUser,
  authHeaders,
  makeLoteConCosecha,
  makeVenta,
} from "@/test-utils/api-test-helpers";

const NONEXISTENT_ID = "507f1f77bcf86cd799439011";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

describe("GET /api/batches/[id]", () => {
  it("devuelve el detalle del batch con sus jars y recipientes (vacio si no hay ninguno)", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 2 });

    const { status, json } = await callRoute(GET, { headers, params: { id: batch._id } });

    expect(status).toBe(200);
    expect(json.data.numeroLote).toBe(batch.numeroLote);
    expect(json.data.jars).toHaveLength(2);
    expect(json.data.recipientes).toEqual([]);
  });

  it("incluye los recipientes del lote con tipoSustratoId y origenFrascoIds poblados", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars, { userId: user._id, headers });
    const recipiente = await makeRecipiente({ userId: user._id, headers, batchId: batch._id, origenFrascoIds: [jarId] });

    const { json } = await callRoute(GET, { headers, params: { id: batch._id } });

    expect(json.data.recipientes).toHaveLength(1);
    expect(json.data.recipientes[0]._id).toBe(recipiente._id);
    expect(json.data.recipientes[0].tipoSustratoId).toHaveProperty("nombre");
    expect(json.data.recipientes[0].origenFrascoIds[0]).toHaveProperty("numeroGuia");
  });

  it("si el lote se inicio desde un frasco de micelio liquido, incluye origenFrascoLiquidoId poblado (numeroGuia)", async () => {
    const clonacion = await makeClonacion({ userId: user._id, headers, cantidadPlacas: 1 });
    const [placaId] = await colonizarPlacas([clonacion.placas[0]], { userId: user._id, headers });
    const frasco = await makeFrascoLiquido({ userId: user._id, headers, origenPlacaId: placaId });

    await colonizarFrascosLiquidos([frasco], { userId: user._id, headers });

    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1, origenFrascoLiquidoId: frasco._id });

    const { json } = await callRoute(GET, { headers, params: { id: batch._id } });

    expect(json.data.origenFrascoLiquidoId).toHaveProperty("numeroGuia", frasco.numeroGuia);
    expect(json.data.fungusTypeId._id).toBe(clonacion.fungusTypeId);
  });

  it("un batch puede originarse de un frasco nacido de 'comprado' (sin placa), igual que de uno de 'placa'", async () => {
    const fungusType = await makeFungusType({ userId: user._id, headers });
    const clonacion = await makeClonacionDirecta({
      userId: user._id,
      headers,
      origenProceso: "comprado",
      fungusTypeId: fungusType._id,
      cantidadFrascos: 1,
    });
    const frasco = clonacion.frascosLiquidos[0];

    await colonizarFrascosLiquidos([frasco], { userId: user._id, headers });

    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1, origenFrascoLiquidoId: frasco._id });

    const { json } = await callRoute(GET, { headers, params: { id: batch._id } });

    expect(json.data.origenFrascoLiquidoId).toHaveProperty("numeroGuia", frasco.numeroGuia);
    expect(json.data.fungusTypeId._id).toBe(fungusType._id);
  });

  it("404 en un id inexistente", async () => {
    const { status, json } = await callRoute(GET, { headers, params: { id: NONEXISTENT_ID } });

    expect(status).toBe(404);
    expect(json.error).toMatch(/no encontrado/i);
  });
});

describe("PATCH /api/batches/[id]", () => {
  const patch = (id: string, body: unknown, h = headers) =>
    callRoute(PATCH, { method: "PATCH", headers: h, params: { id }, body });

  it("cambia el hongo y renombra lote, frascos y recipientes con las iniciales nuevas", async () => {
    const girgola = await makeFungusType({ userId: user._id, headers, iniciales: "GI" });
    const shiitake = await makeFungusType({ userId: user._id, headers, iniciales: "SH" });
    const batch = await makeBatch({ userId: user._id, headers, fungusTypeId: girgola._id, cantidadFrascos: 2 });
    const [jarId] = await colonizarJars([batch.jars[0]], { userId: user._id, headers });
    await makeRecipiente({ userId: user._id, headers, batchId: batch._id, origenFrascoIds: [jarId] });
    const base = batch.numeroLote.replace(/^GI-/, "");

    const { status, json } = await patch(batch._id, { fungusTypeId: shiitake._id });

    expect(status).toBe(200);
    expect(json.data.numeroLote).toBe(`SH-${base}`);
    expect(String(json.data.fungusTypeId)).toBe(shiitake._id);
    const jars = await Jar.find({ batchId: batch._id }).sort({ numeroGuia: 1 }).lean();
    expect(jars.map((j) => j.numeroGuia)).toEqual([`SH-${base}-F01`, `SH-${base}-F02`]);
    const recipientes = await Recipiente.find({ batchId: batch._id }).lean();
    expect(recipientes.map((r) => r.numeroSeguimiento)).toEqual([`SH-${base}-R01`]);
  });

  it("si el hongo nuevo no tiene iniciales, el lote queda sin prefijo", async () => {
    const girgola = await makeFungusType({ userId: user._id, headers, iniciales: "GI" });
    const sinIniciales = await makeFungusType({ userId: user._id, headers });
    const batch = await makeBatch({ userId: user._id, headers, fungusTypeId: girgola._id, cantidadFrascos: 1 });

    const { json } = await patch(batch._id, { fungusTypeId: sinIniciales._id });

    expect(json.data.numeroLote).toBe(batch.numeroLote.replace(/^GI-/, ""));
  });

  it("los dias esperados siguen al hongo nuevo solo si eran el default del anterior", async () => {
    const a = await makeFungusType({
      userId: user._id,
      headers,
      diasEsperadosDefault: { inoculacionGrano: 14, incubacion: 20, fructificacion: 10 },
    });
    const b = await makeFungusType({
      userId: user._id,
      headers,
      diasEsperadosDefault: { inoculacionGrano: 21, incubacion: 20, fructificacion: 10 },
    });
    const conDefault = await makeBatch({ userId: user._id, headers, fungusTypeId: a._id, cantidadFrascos: 1 });
    const editado = await makeBatch({ userId: user._id, headers, fungusTypeId: a._id, cantidadFrascos: 1, diasEsperados: 30 });

    await patch(conDefault._id, { fungusTypeId: b._id });
    await patch(editado._id, { fungusTypeId: b._id });

    expect((await Batch.findById(conDefault._id).lean())!.inoculacionGrano.diasEsperados).toBe(21);
    expect((await Batch.findById(editado._id).lean())!.inoculacionGrano.diasEsperados).toBe(30);
  });

  it("cambia la fecha de inoculacion sin tocar el numero de lote", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1, fechaInicio: "2026-10-01" });

    const { status, json } = await patch(batch._id, { fechaInicio: "2026-09-28" });

    expect(status).toBe(200);
    expect(json.data.inoculacionGrano.fechaInicio).toBe("2026-09-28T00:00:00.000Z");
    expect(json.data.numeroLote).toBe(batch.numeroLote);
  });

  it("409 al cambiar el hongo de un lote iniciado desde micelio liquido", async () => {
    const clonacion = await makeClonacion({ userId: user._id, headers, cantidadPlacas: 1 });
    const [placaId] = await colonizarPlacas([clonacion.placas[0]], { userId: user._id, headers });
    const frasco = await makeFrascoLiquido({ userId: user._id, headers, origenPlacaId: placaId });
    await colonizarFrascosLiquidos([frasco], { userId: user._id, headers });
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1, origenFrascoLiquidoId: frasco._id });
    const otro = await makeFungusType({ userId: user._id, headers });

    const { status, json } = await patch(batch._id, { fungusTypeId: otro._id });

    expect(status).toBe(409);
    expect(json.code).toBe("lote_hongo_derivado_de_frasco_liquido");
    // La fecha si se puede corregir igual.
    const res = await patch(batch._id, { fechaInicio: "2026-09-30" });
    expect(res.status).toBe(200);
  });

  it("409 al cambiar el hongo si ya hay clonaciones hechas desde el lote", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars, { userId: user._id, headers });
    await makeClonacionDirecta({ userId: user._id, headers, origenProceso: "frascoGrano", origenJarId: jarId });
    const otro = await makeFungusType({ userId: user._id, headers });

    const { status, json } = await patch(batch._id, { fungusTypeId: otro._id });

    expect(status).toBe(409);
    expect(json.code).toBe("lote_con_clonaciones");
  });

  it("400 sin cambios y 404 en un lote de otro usuario", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });

    expect((await patch(batch._id, {})).status).toBe(400);

    const otro = await makeUser();
    const { status } = await patch(batch._id, { fechaInicio: "2026-09-30" }, authHeaders(otro));
    expect(status).toBe(404);
  });
});

describe("GET /api/batches/[id] — comercial", () => {
  it("sin cosecha ni ventas: todo en 0 y margen = −costo", async () => {
    const batch = await makeBatch({ userId: user._id, headers, pesoGranoKg: 10, precioPorKg: 500 });
    const { json } = await callRoute(GET, { headers, params: { id: batch._id } });
    expect(json.data.comercial).toEqual({
      cosechadoKg: 0,
      vendidoKg: 0,
      mermaKg: 0,
      disponibleKg: 0,
      ingresos: 0,
      margen: -5000,
      precioPromedioKg: null,
    });
  });

  it("refleja lo vendido: ingresos, margen = ingresos − costoTotal y precio promedio", async () => {
    // Costo: grano 10 × 500 + sustrato 20 × 100 = 7000.
    const { batch } = await makeLoteConCosecha({ userId: user._id, headers, cosechadoKg: 3 });
    const { batch: otro } = await makeLoteConCosecha({ userId: user._id, headers, cosechadoKg: 3 });
    await makeVenta({
      userId: user._id,
      headers,
      items: [
        { batchId: batch._id, kg: 2, precioPorKg: 8000 },
        { batchId: otro._id, kg: 1, precioPorKg: 1 },
      ],
    });
    await makeVenta({ userId: user._id, headers, items: [{ batchId: batch._id, kg: 0.5, precioPorKg: 6000 }] });

    const { json } = await callRoute(GET, { headers, params: { id: batch._id } });
    expect(json.data.comercial).toEqual({
      cosechadoKg: 3,
      vendidoKg: 2.5,
      mermaKg: 0,
      disponibleKg: 0.5,
      ingresos: 19000,
      margen: 12000,
      precioPromedioKg: 7600,
    });
  });
});
