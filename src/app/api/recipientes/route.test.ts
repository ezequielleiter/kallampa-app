import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST } from "./route";
import {
  callRoute,
  makeBatch,
  makeGrainType,
  makeFungusType,
  makeSubstrateType,
  colonizarJars,
  makeRecipiente,
  makeUser,
  authHeaders,
} from "@/test-utils/api-test-helpers";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

describe("POST /api/recipientes", () => {
  it("crea el recipiente con numeroSeguimiento correlativo por lote y marca los frascos de origen como 'usado'", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 2 });
    const [jarId1, jarId2] = await colonizarJars(batch.jars, { userId: user._id, headers });

    const recipiente = await makeRecipiente({
      userId: user._id,
      headers,
      batchId: batch._id,
      origenFrascoIds: [jarId1, jarId2],
    });

    expect(recipiente.numeroSeguimiento).toBe(`${batch.numeroLote}-R01`);
    expect(recipiente.estado).toBe("incubando");
    expect(recipiente.origenFrascoIds.sort()).toEqual([jarId1, jarId2].sort());

    const { GET: getJars } = await import("@/app/api/jars/route");
    const { json } = await callRoute(getJars, { headers, searchParams: { batchId: batch._id } });
    expect(json.data.every((j: { estado: string }) => j.estado === "usado")).toBe(true);
  });

  it("el segundo recipiente del mismo lote sigue el correlativo (R02)", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 2 });
    const [jarId1, jarId2] = await colonizarJars(batch.jars, { userId: user._id, headers });

    const r1 = await makeRecipiente({ userId: user._id, headers, batchId: batch._id, origenFrascoIds: [jarId1] });
    const r2 = await makeRecipiente({ userId: user._id, headers, batchId: batch._id, origenFrascoIds: [jarId2] });

    expect(r1.numeroSeguimiento).toBe(`${batch.numeroLote}-R01`);
    expect(r2.numeroSeguimiento).toBe(`${batch.numeroLote}-R02`);
  });

  it("usa diasEsperadosDefault.incubacion del hongo si no se manda diasEsperadosIncubacion", async () => {
    const fungusType = await makeFungusType({
      userId: user._id,
      headers,
      diasEsperadosDefault: { inoculacionGrano: 14, incubacion: 25, fructificacion: 10 },
    });
    const grainType = await makeGrainType({ userId: user._id, headers });
    const batch = await makeBatch({
      userId: user._id,
      headers,
      cantidadFrascos: 1,
      fungusTypeId: fungusType._id,
      tipoGranoId: grainType._id,
    });
    const [jarId] = await colonizarJars(batch.jars, { userId: user._id, headers });

    const recipiente = await makeRecipiente({ userId: user._id, headers, batchId: batch._id, origenFrascoIds: [jarId] });
    expect(recipiente.diasEsperadosIncubacion).toBe(25);
  });

  it("rechaza un frasco que todavia esta 'colonizando' (no listo) con 409", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      body: {
        batchId: batch._id,
        origenFrascoIds: [batch.jars[0]._id],
        tipoSustratoId: (await makeSubstrateType({ userId: user._id, headers }))._id,
        pesoSustratoKg: 20,
        precioPorKg: 100,
        fechaInicioIncubacion: new Date().toISOString(),
      },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/no esta disponible/i);
  });

  it("rechaza un frasco contaminado con 409", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    const jarId = batch.jars[0]._id;

    const { PATCH } = await import("@/app/api/jars/[id]/route");
    await callRoute(PATCH, { params: { id: jarId }, method: "PATCH", headers, body: { estado: "contaminado" } });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      body: {
        batchId: batch._id,
        origenFrascoIds: [jarId],
        tipoSustratoId: (await makeSubstrateType({ userId: user._id, headers }))._id,
        pesoSustratoKg: 20,
        precioPorKg: 100,
        fechaInicioIncubacion: new Date().toISOString(),
      },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/no esta disponible/i);
  });

  it("un frasco ya 'usado' en un recipiente se puede volver a elegir como origen de otro", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars, { userId: user._id, headers });

    await makeRecipiente({ userId: user._id, headers, batchId: batch._id, origenFrascoIds: [jarId] });

    const { GET: getJars } = await import("@/app/api/jars/route");
    const { json: jarsJson } = await callRoute(getJars, { headers, searchParams: { batchId: batch._id } });
    expect(jarsJson.data[0].estado).toBe("usado");

    const segundoRecipiente = await makeRecipiente({ userId: user._id, headers, batchId: batch._id, origenFrascoIds: [jarId] });
    expect(segundoRecipiente.origenFrascoIds).toEqual([jarId]);
    expect(segundoRecipiente.numeroSeguimiento).toBe(`${batch.numeroLote}-R02`);
  });

  it("rechaza un frasco que pertenece a otro lote con 400", async () => {
    const batch1 = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    const batch2 = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    const [jarDeBatch2] = await colonizarJars(batch2.jars, { userId: user._id, headers });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      body: {
        batchId: batch1._id,
        origenFrascoIds: [jarDeBatch2],
        tipoSustratoId: (await makeSubstrateType({ userId: user._id, headers }))._id,
        pesoSustratoKg: 20,
        precioPorKg: 100,
        fechaInicioIncubacion: new Date().toISOString(),
      },
    });

    expect(status).toBe(400);
    expect(json.error).toMatch(/no pertenece/i);
  });

  it("rechaza con 400 (Zod) un recipiente sin ningun frasco de origen", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      body: {
        batchId: batch._id,
        origenFrascoIds: [],
        tipoSustratoId: (await makeSubstrateType({ userId: user._id, headers }))._id,
        pesoSustratoKg: 20,
        precioPorKg: 100,
        fechaInicioIncubacion: new Date().toISOString(),
      },
    });

    expect(status).toBe(400);
    expect(json.error).toMatch(/al menos un frasco de origen/i);
  });

  it("rechaza con 400 un batchId que pertenece a otro usuario", async () => {
    const otroUsuario = await makeUser();
    const otrosHeaders = authHeaders(otroUsuario);
    const batchDeOtro = await makeBatch({ userId: otroUsuario._id, headers: otrosHeaders, cantidadFrascos: 1 });

    const { status } = await callRoute(POST, {
      method: "POST",
      headers,
      body: {
        batchId: batchDeOtro._id,
        origenFrascoIds: [batchDeOtro.jars[0]._id],
        tipoSustratoId: (await makeSubstrateType({ userId: user._id, headers }))._id,
        pesoSustratoKg: 20,
        precioPorKg: 100,
        fechaInicioIncubacion: new Date().toISOString(),
      },
    });

    expect(status).toBe(400);
  });
});

describe("GET /api/recipientes", () => {
  it("?batchId= lista los recipientes de ese lote con tipoSustratoId poblado", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars, { userId: user._id, headers });
    await makeRecipiente({ userId: user._id, headers, batchId: batch._id, origenFrascoIds: [jarId] });

    const { status, json } = await callRoute(GET, { headers, searchParams: { batchId: batch._id } });
    expect(status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].tipoSustratoId).toHaveProperty("nombre");
  });
});
