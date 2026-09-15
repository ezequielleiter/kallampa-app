import { describe, it, expect } from "vitest";
import { GET, POST } from "./route";
import {
  callRoute,
  makeFungusType,
  makeClonacion,
  colonizarPlacas,
} from "@/test-utils/api-test-helpers";

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
