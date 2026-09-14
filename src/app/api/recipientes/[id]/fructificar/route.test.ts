import { describe, it, expect } from "vitest";
import { POST } from "./route";
import {
  callRoute,
  makeBatch,
  makeFungusType,
  makeGrainType,
  colonizarJars,
  makeRecipiente,
  fructificarRecipiente,
} from "@/test-utils/api-test-helpers";

describe("POST /api/recipientes/[id]/fructificar", () => {
  it("pasa el recipiente a 'fructificando' y setea fechaInicioFructificacion", async () => {
    const batch = await makeBatch({ cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars);
    const recipiente = await makeRecipiente({ batchId: batch._id, origenFrascoIds: [jarId] });

    const fecha = new Date().toISOString();
    const { status, json } = await callRoute(POST, {
      method: "POST",
      params: { id: recipiente._id },
      body: { fechaInicioFructificacion: fecha },
    });

    expect(status).toBe(200);
    expect(json.data.estado).toBe("fructificando");
    expect(new Date(json.data.fechaInicioFructificacion).toISOString()).toBe(fecha);
  });

  it("usa diasEsperadosDefault.fructificacion del hongo si no se manda explicito", async () => {
    const fungusType = await makeFungusType({
      diasEsperadosDefault: { inoculacionGrano: 14, incubacion: 20, fructificacion: 33 },
    });
    const grainType = await makeGrainType();
    const batch = await makeBatch({ cantidadFrascos: 1, fungusTypeId: fungusType._id, tipoGranoId: grainType._id });
    const [jarId] = await colonizarJars(batch.jars);
    const recipiente = await makeRecipiente({ batchId: batch._id, origenFrascoIds: [jarId] });

    const fructificado = await fructificarRecipiente(recipiente._id);
    expect(fructificado.diasEsperadosFructificacion).toBe(33);
  });

  it("409 si el recipiente no esta 'incubando'", async () => {
    const batch = await makeBatch({ cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars);
    const recipiente = await makeRecipiente({ batchId: batch._id, origenFrascoIds: [jarId] });
    await fructificarRecipiente(recipiente._id);

    const { status, json } = await callRoute(POST, {
      method: "POST",
      params: { id: recipiente._id },
      body: { fechaInicioFructificacion: new Date().toISOString() },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/incubando/i);
  });
});
