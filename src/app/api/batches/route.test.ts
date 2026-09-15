import { describe, it, expect } from "vitest";
import { GET, POST } from "./route";
import {
  callRoute,
  makeBatch,
  makeFungusType,
  makeGrainType,
  colonizarJars,
  makeRecipiente,
  makeClonacion,
  colonizarPlacas,
  makeFrascoLiquido,
} from "@/test-utils/api-test-helpers";

const NONEXISTENT_ID = "507f1f77bcf86cd799439011";

describe("POST /api/batches", () => {
  it("crea el batch + N jars con numeroLote y numeroGuia con el formato esperado", async () => {
    const batch = await makeBatch({ cantidadFrascos: 3 });

    const year = new Date().getFullYear();
    expect(batch.numeroLote).toMatch(new RegExp(`^L-${year}-\\d{3}$`));
    expect(batch.jars).toHaveLength(3);

    batch.jars.forEach((jar: { numeroGuia: string }, i: number) => {
      expect(jar.numeroGuia).toBe(`${batch.numeroLote}-F${String(i + 1).padStart(2, "0")}`);
    });
  });

  it("el batch creado no tiene campos de la v1 (estado, oleadas, etc)", async () => {
    const batch = await makeBatch();
    expect(batch.estado).toBeUndefined();
    expect(batch.oleadas).toBeUndefined();
    expect(batch.fructificacion).toBeUndefined();
    expect(batch.cosecha).toBeUndefined();
  });

  it("incrementa la secuencia de numeroLote entre batches del mismo anio", async () => {
    const fungusType = await makeFungusType();
    const grainType = await makeGrainType();
    const b1 = await makeBatch({ fungusTypeId: fungusType._id, tipoGranoId: grainType._id });
    const b2 = await makeBatch({ fungusTypeId: fungusType._id, tipoGranoId: grainType._id });

    const year = new Date().getFullYear();
    expect(b1.numeroLote).toBe(`L-${year}-001`);
    expect(b2.numeroLote).toBe(`L-${year}-002`);
  });

  it("rechaza un fungusTypeId inexistente con 400", async () => {
    const grainType = await makeGrainType();
    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: {
        fungusTypeId: NONEXISTENT_ID,
        tipoGranoId: grainType._id,
        pesoGranoKg: 10,
        precioPorKg: 100,
        cantidadFrascos: 2,
        fechaInicio: new Date().toISOString(),
      },
    });

    expect(status).toBe(400);
    expect(json.error).toMatch(/no existe/i);
  });

  it("usa diasEsperadosDefault.inoculacionGrano del hongo si no se manda diasEsperados", async () => {
    const fungusType = await makeFungusType({
      diasEsperadosDefault: { inoculacionGrano: 21, incubacion: 20, fructificacion: 10 },
    });
    const batch = await makeBatch({ fungusTypeId: fungusType._id });

    expect(batch.inoculacionGrano.diasEsperados).toBe(21);
  });

  it("usa el diasEsperados explicito si se manda, ignorando el default del hongo", async () => {
    const fungusType = await makeFungusType({
      diasEsperadosDefault: { inoculacionGrano: 21, incubacion: 20, fructificacion: 10 },
    });
    const batch = await makeBatch({ fungusTypeId: fungusType._id, diasEsperados: 9 });

    expect(batch.inoculacionGrano.diasEsperados).toBe(9);
  });

  it("rechaza un body sin fungusTypeId ni origenFrascoLiquidoId con 400 (Zod)", async () => {
    const grainType = await makeGrainType();
    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: {
        tipoGranoId: grainType._id,
        pesoGranoKg: 10,
        precioPorKg: 100,
        cantidadFrascos: 2,
        fechaInicio: new Date().toISOString(),
      },
    });

    expect(status).toBe(400);
    expect(json.error).toMatch(/hongo o un frasco de micelio líquido/i);
  });
});

describe("POST /api/batches - origen desde un frasco de micelio liquido (Clonacion)", () => {
  it("deriva el fungusTypeId de la clonacion del frasco liquido de origen", async () => {
    const clonacion = await makeClonacion({ cantidadPlacas: 1 });
    const [placaId] = await colonizarPlacas([clonacion.placas[0]]);
    const frasco = await makeFrascoLiquido({ origenPlacaId: placaId });

    const batch = await makeBatch({ cantidadFrascos: 1, origenFrascoLiquidoId: frasco._id });

    expect(batch.fungusTypeId).toBe(clonacion.fungusTypeId);
    expect(batch.origenFrascoLiquidoId).toBe(frasco._id);
  });

  it("rechaza un frasco liquido inexistente con 400", async () => {
    const grainType = await makeGrainType();
    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: {
        origenFrascoLiquidoId: "507f1f77bcf86cd799439011",
        tipoGranoId: grainType._id,
        pesoGranoKg: 10,
        precioPorKg: 100,
        cantidadFrascos: 2,
        fechaInicio: new Date().toISOString(),
      },
    });

    expect(status).toBe(400);
    expect(json.error).toMatch(/no existe/i);
  });

  it("rechaza un frasco liquido que no esta 'valido' (ej. contaminado) con 409", async () => {
    const clonacion = await makeClonacion({ cantidadPlacas: 1 });
    const [placaId] = await colonizarPlacas([clonacion.placas[0]]);
    const frasco = await makeFrascoLiquido({ origenPlacaId: placaId });

    const { PATCH } = await import("@/app/api/frascos-liquidos/[id]/route");
    await callRoute(PATCH, {
      method: "PATCH",
      params: { id: frasco._id },
      body: { estado: "contaminado" },
    });

    const grainType = await makeGrainType();
    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: {
        origenFrascoLiquidoId: frasco._id,
        tipoGranoId: grainType._id,
        pesoGranoKg: 10,
        precioPorKg: 100,
        cantidadFrascos: 2,
        fechaInicio: new Date().toISOString(),
      },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/no está disponible/i);
  });
});

describe("GET /api/batches", () => {
  it("sin recipientes: estadoDerivado 'en_progreso' y 0 alertas", async () => {
    await makeBatch();

    const { status, json } = await callRoute(GET);
    expect(status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].estadoDerivado).toBe("en_progreso");
    expect(json.data[0].alertas).toBe(0);
  });

  it("lista todos los batches con su fungusTypeId poblado", async () => {
    await makeBatch();
    await makeBatch();

    const { json } = await callRoute(GET);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].fungusTypeId).toHaveProperty("nombre");
  });

  it("estadoDerivado 'finalizado' cuando el unico recipiente ya finalizo", async () => {
    const batch = await makeBatch({ cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars);
    const recipiente = await makeRecipiente({ batchId: batch._id, origenFrascoIds: [jarId] });

    const { POST: marcarEstado } = await import("@/app/api/recipientes/[id]/estado/route");
    await callRoute(marcarEstado, {
      method: "POST",
      params: { id: recipiente._id },
      body: { estado: "finalizado" },
    });

    const { json } = await callRoute(GET);
    const item = json.data.find((b: { numeroLote: string }) => b.numeroLote === batch.numeroLote);
    expect(item.estadoDerivado).toBe("finalizado");
  });
});
