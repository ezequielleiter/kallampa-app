import { describe, it, expect } from "vitest";
import { GET, POST } from "./route";
import {
  callRoute,
  makeBatch,
  makeGrainType,
  makeFungusType,
  makeSubstrateType,
  colonizarJars,
  makeRecipiente,
} from "@/test-utils/api-test-helpers";

describe("POST /api/recipientes", () => {
  it("crea el recipiente con numeroSeguimiento correlativo por lote y marca los frascos de origen como 'usado'", async () => {
    const batch = await makeBatch({ cantidadFrascos: 2 });
    const [jarId1, jarId2] = await colonizarJars(batch.jars);

    const recipiente = await makeRecipiente({
      batchId: batch._id,
      origenFrascoIds: [jarId1, jarId2],
    });

    expect(recipiente.numeroSeguimiento).toBe(`${batch.numeroLote}-R01`);
    expect(recipiente.estado).toBe("incubando");
    expect(recipiente.origenFrascoIds.sort()).toEqual([jarId1, jarId2].sort());

    const { GET: getJars } = await import("@/app/api/jars/route");
    const { json } = await callRoute(getJars, { searchParams: { batchId: batch._id } });
    expect(json.data.every((j: { estado: string }) => j.estado === "usado")).toBe(true);
  });

  it("el segundo recipiente del mismo lote sigue el correlativo (R02)", async () => {
    const batch = await makeBatch({ cantidadFrascos: 2 });
    const [jarId1, jarId2] = await colonizarJars(batch.jars);

    const r1 = await makeRecipiente({ batchId: batch._id, origenFrascoIds: [jarId1] });
    const r2 = await makeRecipiente({ batchId: batch._id, origenFrascoIds: [jarId2] });

    expect(r1.numeroSeguimiento).toBe(`${batch.numeroLote}-R01`);
    expect(r2.numeroSeguimiento).toBe(`${batch.numeroLote}-R02`);
  });

  it("usa diasEsperadosDefault.incubacion del hongo si no se manda diasEsperadosIncubacion", async () => {
    const fungusType = await makeFungusType({
      diasEsperadosDefault: { inoculacionGrano: 14, incubacion: 25, fructificacion: 10 },
    });
    const grainType = await makeGrainType();
    const batch = await makeBatch({ cantidadFrascos: 1, fungusTypeId: fungusType._id, tipoGranoId: grainType._id });
    const [jarId] = await colonizarJars(batch.jars);

    const recipiente = await makeRecipiente({ batchId: batch._id, origenFrascoIds: [jarId] });
    expect(recipiente.diasEsperadosIncubacion).toBe(25);
  });

  it("rechaza un frasco que todavia esta 'colonizando' (no listo) con 409", async () => {
    const batch = await makeBatch({ cantidadFrascos: 1 });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: {
        batchId: batch._id,
        origenFrascoIds: [batch.jars[0]._id],
        tipoSustratoId: (await makeSubstrateType())._id,
        pesoSustratoKg: 20,
        precioPorKg: 100,
        fechaInicioIncubacion: new Date().toISOString(),
      },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/no esta disponible/i);
  });

  it("rechaza un frasco contaminado con 409", async () => {
    const batch = await makeBatch({ cantidadFrascos: 1 });
    const jarId = batch.jars[0]._id;

    const { PATCH } = await import("@/app/api/jars/[id]/route");
    await callRoute(PATCH, { params: { id: jarId }, method: "PATCH", body: { estado: "contaminado" } });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: {
        batchId: batch._id,
        origenFrascoIds: [jarId],
        tipoSustratoId: (await makeSubstrateType())._id,
        pesoSustratoKg: 20,
        precioPorKg: 100,
        fechaInicioIncubacion: new Date().toISOString(),
      },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/no esta disponible/i);
  });

  it("un frasco ya 'usado' en un recipiente se puede volver a elegir como origen de otro", async () => {
    const batch = await makeBatch({ cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars);

    await makeRecipiente({ batchId: batch._id, origenFrascoIds: [jarId] });

    const { GET: getJars } = await import("@/app/api/jars/route");
    const { json: jarsJson } = await callRoute(getJars, { searchParams: { batchId: batch._id } });
    expect(jarsJson.data[0].estado).toBe("usado");

    const segundoRecipiente = await makeRecipiente({ batchId: batch._id, origenFrascoIds: [jarId] });
    expect(segundoRecipiente.origenFrascoIds).toEqual([jarId]);
    expect(segundoRecipiente.numeroSeguimiento).toBe(`${batch.numeroLote}-R02`);
  });

  it("rechaza un frasco que pertenece a otro lote con 400", async () => {
    const batch1 = await makeBatch({ cantidadFrascos: 1 });
    const batch2 = await makeBatch({ cantidadFrascos: 1 });
    const [jarDeBatch2] = await colonizarJars(batch2.jars);

    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: {
        batchId: batch1._id,
        origenFrascoIds: [jarDeBatch2],
        tipoSustratoId: (await makeSubstrateType())._id,
        pesoSustratoKg: 20,
        precioPorKg: 100,
        fechaInicioIncubacion: new Date().toISOString(),
      },
    });

    expect(status).toBe(400);
    expect(json.error).toMatch(/no pertenece/i);
  });
});

describe("GET /api/recipientes", () => {
  it("?batchId= lista los recipientes de ese lote con tipoSustratoId poblado", async () => {
    const batch = await makeBatch({ cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars);
    await makeRecipiente({ batchId: batch._id, origenFrascoIds: [jarId] });

    const { status, json } = await callRoute(GET, { searchParams: { batchId: batch._id } });
    expect(status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].tipoSustratoId).toHaveProperty("nombre");
  });
});
