import { describe, it, expect } from "vitest";
import { POST as advanceStage } from "./route";
import { POST as discard } from "../discard/route";
import {
  callRoute,
  makeBatch,
  makeFungusType,
  makeSubstrateType,
} from "@/test-utils/api-test-helpers";

describe("POST /api/batches/[id]/advance-stage", () => {
  it("una transicion valida en orden avanza el estado", async () => {
    const batch = await makeBatch();
    const substrateType = await makeSubstrateType();

    const { status, json } = await callRoute(advanceStage, {
      method: "POST",
      params: { id: batch._id },
      body: {
        targetStage: "crecimiento_sustrato",
        tipoSustratoId: substrateType._id,
        kilosSustrato: 20,
        precioPorKg: 100,
        fechaInicio: new Date().toISOString(),
      },
    });

    expect(status).toBe(200);
    expect(json.data.estado).toBe("crecimiento_sustrato");
    expect(json.data.inoculacionGrano.fechaFin).toBeTruthy();
    expect(
      json.data.historialEstados.some((h: { estado: string }) => h.estado === "crecimiento_sustrato")
    ).toBe(true);
  });

  it("una transicion que salta una etapa devuelve 409", async () => {
    const batch = await makeBatch();

    const { status, json } = await callRoute(advanceStage, {
      method: "POST",
      params: { id: batch._id },
      body: {
        targetStage: "fructificacion",
        fechaInicio: new Date().toISOString(),
        recipientes: [{ codigo: "R1", pesoKg: 5 }],
      },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/transicion invalida/i);
  });

  it("avanzar un lote descartado devuelve 409", async () => {
    const batch = await makeBatch();
    await callRoute(discard, {
      method: "POST",
      params: { id: batch._id },
      body: { motivo: "Contaminacion detectada en prueba" },
    });

    const substrateType = await makeSubstrateType();
    const { status, json } = await callRoute(advanceStage, {
      method: "POST",
      params: { id: batch._id },
      body: {
        targetStage: "crecimiento_sustrato",
        tipoSustratoId: substrateType._id,
        kilosSustrato: 20,
        precioPorKg: 100,
        fechaInicio: new Date().toISOString(),
      },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/descartado/i);
  });

  it("usa el default del hongo para diasEsperados de la etapa destino si no viene explicito", async () => {
    const fungusType = await makeFungusType({
      diasEsperadosDefault: {
        inoculacionGrano: 14,
        crecimientoSustrato: 33,
        fructificacion: 10,
        cosecha: 15,
      },
    });
    const batch = await makeBatch({ fungusTypeId: fungusType._id });
    const substrateType = await makeSubstrateType();

    const { json } = await callRoute(advanceStage, {
      method: "POST",
      params: { id: batch._id },
      body: {
        targetStage: "crecimiento_sustrato",
        tipoSustratoId: substrateType._id,
        kilosSustrato: 20,
        precioPorKg: 100,
        fechaInicio: new Date().toISOString(),
      },
    });

    expect(json.data.crecimientoSustrato.diasEsperados).toBe(33);
  });

  it("respeta el diasEsperados explicito si se manda, en vez del default del hongo", async () => {
    const fungusType = await makeFungusType({
      diasEsperadosDefault: {
        inoculacionGrano: 14,
        crecimientoSustrato: 33,
        fructificacion: 10,
        cosecha: 15,
      },
    });
    const batch = await makeBatch({ fungusTypeId: fungusType._id });
    const substrateType = await makeSubstrateType();

    const { json } = await callRoute(advanceStage, {
      method: "POST",
      params: { id: batch._id },
      body: {
        targetStage: "crecimiento_sustrato",
        tipoSustratoId: substrateType._id,
        kilosSustrato: 20,
        precioPorKg: 100,
        fechaInicio: new Date().toISOString(),
        diasEsperados: 7,
      },
    });

    expect(json.data.crecimientoSustrato.diasEsperados).toBe(7);
  });
});
