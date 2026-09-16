import { describe, it, expect } from "vitest";
import { GET, POST } from "./route";
import {
  callRoute,
  makeFungusType,
  makeClonacion,
  colonizarPlacas,
  makeBatch,
  colonizarJars,
  makeRecipiente,
  fructificarRecipiente,
} from "@/test-utils/api-test-helpers";

const DIAS_CON_PLACAS = { inoculacionGrano: 14, incubacion: 20, fructificacion: 10, colonizacionPlacas: 15 };

describe("POST /api/clonaciones", () => {
  it("crea la clonacion con numeroLote correlativo y sus placas P01..Pnn", async () => {
    const clonacion = await makeClonacion({ cantidadPlacas: 3 });

    expect(clonacion.numeroLote).toMatch(/^C-\d{4}-\d{3}$/);
    expect(clonacion.placas).toHaveLength(3);
    expect(clonacion.placas.map((p: { numeroPlaca: string }) => p.numeroPlaca).sort()).toEqual([
      `${clonacion.numeroLote}-P01`,
      `${clonacion.numeroLote}-P02`,
      `${clonacion.numeroLote}-P03`,
    ]);
    expect(clonacion.placas.every((p: { estado: string }) => p.estado === "colonizando")).toBe(
      true
    );
  });

  it("prefija numeroLote y numeroPlaca con las iniciales del hongo cuando estan configuradas", async () => {
    const fungusType = await makeFungusType({ iniciales: "OST", diasEsperadosDefault: DIAS_CON_PLACAS });
    const clonacion = await makeClonacion({ fungusTypeId: fungusType._id, cantidadPlacas: 2 });

    expect(clonacion.numeroLote).toMatch(/^OST-C-/);
    clonacion.placas.forEach((placa: { numeroPlaca: string }) => {
      expect(placa.numeroPlaca).toMatch(/^OST-C-/);
    });
  });

  it("el segundo lote de clonacion sigue el correlativo (C-<anio>-002)", async () => {
    const c1 = await makeClonacion();
    const c2 = await makeClonacion();

    const n1 = Number(c1.numeroLote.split("-")[2]);
    const n2 = Number(c2.numeroLote.split("-")[2]);
    expect(n2).toBe(n1 + 1);
  });

  it("usa diasEsperadosDefault.colonizacionPlacas del hongo si no se manda diasEsperados", async () => {
    const clonacion = await makeClonacion({ diasEsperados: undefined });
    expect(clonacion.colonizacion.diasEsperados).toBe(15);
  });

  it("guarda recetaAgar si se manda, y no la exige (opcional)", async () => {
    const fungusType = await makeFungusType({
      diasEsperadosDefault: { inoculacionGrano: 14, incubacion: 20, fructificacion: 10, colonizacionPlacas: 7 },
    });

    const { status: statusConReceta, json: jsonConReceta } = await callRoute(POST, {
      method: "POST",
      body: {
        fungusTypeId: fungusType._id,
        cantidadPlacas: 1,
        fechaInicio: new Date().toISOString(),
        recetaAgar: "PDA 39g/L + extracto de malta 10g/L",
      },
    });
    expect(statusConReceta).toBe(201);
    expect(jsonConReceta.data.recetaAgar).toBe("PDA 39g/L + extracto de malta 10g/L");

    const { status: statusSinReceta, json: jsonSinReceta } = await callRoute(POST, {
      method: "POST",
      body: {
        fungusTypeId: fungusType._id,
        cantidadPlacas: 1,
        fechaInicio: new Date().toISOString(),
      },
    });
    expect(statusSinReceta).toBe(201);
    expect(jsonSinReceta.data.recetaAgar).toBeUndefined();
  });

  it("usa diasEsperados explicito si se manda, aunque el hongo tenga default", async () => {
    const clonacion = await makeClonacion({ diasEsperados: 21 });
    expect(clonacion.colonizacion.diasEsperados).toBe(21);
  });

  it("rechaza con 400 si el hongo no tiene colonizacionPlacas y no se manda diasEsperados", async () => {
    const fungusType = await makeFungusType({
      diasEsperadosDefault: { inoculacionGrano: 14, incubacion: 20, fructificacion: 10 },
    });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: {
        fungusTypeId: fungusType._id,
        cantidadPlacas: 2,
        fechaInicio: new Date().toISOString(),
      },
    });

    expect(status).toBe(400);
    expect(json.error).toMatch(/colonizacionPlacas/i);
  });

  it("rechaza con 400 si el hongo no existe", async () => {
    const { status } = await callRoute(POST, {
      method: "POST",
      body: {
        fungusTypeId: "000000000000000000000000",
        cantidadPlacas: 2,
        fechaInicio: new Date().toISOString(),
      },
    });
    expect(status).toBe(400);
  });
});

describe("POST /api/clonaciones - origen desde un Jar o Recipiente (Batch)", () => {
  it("deriva el fungusTypeId de un jar 'colonizado' y guarda origenTipo/origenBatchId", async () => {
    const fungusType = await makeFungusType({
      diasEsperadosDefault: { inoculacionGrano: 14, incubacion: 20, fructificacion: 10 },
    });
    const batch = await makeBatch({ fungusTypeId: fungusType._id, cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars);

    const clonacion = await makeClonacion({ origenJarId: jarId, cantidadPlacas: 2, diasEsperados: 15 });

    expect(clonacion.fungusTypeId).toBe(fungusType._id);
    expect(clonacion.origenTipo).toBe("jar");
    expect(clonacion.origenJarId).toBe(jarId);
    expect(clonacion.origenBatchId).toBe(batch._id);
  });

  it("rechaza con 409 un origenJarId de un jar 'colonizando'", async () => {
    const batch = await makeBatch({ cantidadFrascos: 1 });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: {
        origenJarId: batch.jars[0]._id,
        cantidadPlacas: 2,
        fechaInicio: new Date().toISOString(),
      },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/no está disponible para clonar/i);
  });

  it("rechaza con 409 un origenJarId de un jar 'contaminado'", async () => {
    const batch = await makeBatch({ cantidadFrascos: 1 });
    const { PATCH } = await import("@/app/api/jars/[id]/route");
    await callRoute(PATCH, {
      method: "PATCH",
      params: { id: batch.jars[0]._id },
      body: { estado: "contaminado" },
    });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: {
        origenJarId: batch.jars[0]._id,
        cantidadPlacas: 2,
        fechaInicio: new Date().toISOString(),
      },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/no está disponible para clonar/i);
  });

  it("deriva el fungusTypeId de un recipiente 'fructificando'", async () => {
    const fungusType = await makeFungusType({
      diasEsperadosDefault: { inoculacionGrano: 14, incubacion: 20, fructificacion: 10 },
    });
    const batch = await makeBatch({ fungusTypeId: fungusType._id, cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars);
    const recipiente = await makeRecipiente({ batchId: batch._id, origenFrascoIds: [jarId] });
    await fructificarRecipiente(recipiente._id);

    const clonacion = await makeClonacion({
      origenRecipienteId: recipiente._id,
      cantidadPlacas: 2,
      diasEsperados: 15,
    });

    expect(clonacion.fungusTypeId).toBe(fungusType._id);
    expect(clonacion.origenTipo).toBe("recipiente");
    expect(clonacion.origenRecipienteId).toBe(recipiente._id);
    expect(clonacion.origenBatchId).toBe(batch._id);
  });

  it("rechaza con 409 un origenRecipienteId de un recipiente 'incubando'", async () => {
    const batch = await makeBatch({ cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars);
    const recipiente = await makeRecipiente({ batchId: batch._id, origenFrascoIds: [jarId] });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: {
        origenRecipienteId: recipiente._id,
        cantidadPlacas: 2,
        fechaInicio: new Date().toISOString(),
      },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/no está disponible para clonar/i);
  });

  it("rechaza con 409 un origenRecipienteId de un recipiente 'finalizado'", async () => {
    const batch = await makeBatch({ cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars);
    const recipiente = await makeRecipiente({ batchId: batch._id, origenFrascoIds: [jarId] });

    const { POST: marcarEstado } = await import("@/app/api/recipientes/[id]/estado/route");
    await callRoute(marcarEstado, {
      method: "POST",
      params: { id: recipiente._id },
      body: { estado: "finalizado" },
    });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: {
        origenRecipienteId: recipiente._id,
        cantidadPlacas: 2,
        fechaInicio: new Date().toISOString(),
      },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/no está disponible para clonar/i);
  });

  it("rechaza con 400 (Zod) si no viene ninguna fuente de hongo", async () => {
    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: {
        cantidadPlacas: 2,
        fechaInicio: new Date().toISOString(),
      },
    });

    expect(status).toBe(400);
    expect(json.error).toMatch(/Elegí un tipo de hongo/i);
  });

  it("rechaza con 400 (Zod) si vienen origenJarId y origenRecipienteId juntos", async () => {
    const batch = await makeBatch({ cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars);
    const recipiente = await makeRecipiente({ batchId: batch._id, origenFrascoIds: [jarId] });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: {
        origenJarId: jarId,
        origenRecipienteId: recipiente._id,
        cantidadPlacas: 2,
        fechaInicio: new Date().toISOString(),
      },
    });

    expect(status).toBe(400);
    expect(json.error).toMatch(/no se puede clonar desde un frasco y un recipiente/i);
  });
});

describe("GET /api/clonaciones", () => {
  it("lista las clonaciones con fungusTypeId poblado y el resumen calculado", async () => {
    const clonacion = await makeClonacion({ cantidadPlacas: 3 });
    await colonizarPlacas([clonacion.placas[0], clonacion.placas[1]]);

    const { PATCH } = await import("@/app/api/placas/[id]/route");
    await callRoute(PATCH, {
      method: "PATCH",
      params: { id: clonacion.placas[2]._id },
      body: { estado: "contaminado" },
    });

    const { status, json } = await callRoute(GET);
    expect(status).toBe(200);
    expect(json.data).toHaveLength(1);
    const item = json.data[0];
    expect(item.fungusTypeId).toHaveProperty("nombre");
    expect(item.resumen).toEqual({
      placasColonizando: 0,
      placasColonizado: 2,
      placasContaminado: 1,
      frascosLiquidosValidos: 0,
      frascosLiquidosVacios: 0,
      frascosLiquidosFinalizados: 0,
      frascosLiquidosContaminados: 0,
      alertas: 0,
    });
  });
});
