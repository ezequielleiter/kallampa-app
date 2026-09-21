import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "./route";
import {
  callRoute,
  makeBatch,
  makeFungusType,
  makeGrainType,
  colonizarJars,
  makeRecipiente,
  fructificarRecipiente,
  makeUser,
  authHeaders,
} from "@/test-utils/api-test-helpers";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

describe("POST /api/recipientes/[id]/fructificar", () => {
  it("pasa el recipiente a 'fructificando' y setea fechaInicioFructificacion", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars, { userId: user._id, headers });
    const recipiente = await makeRecipiente({ userId: user._id, headers, batchId: batch._id, origenFrascoIds: [jarId] });

    const fecha = new Date().toISOString();
    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      params: { id: recipiente._id },
      body: { fechaInicioFructificacion: fecha },
    });

    expect(status).toBe(200);
    expect(json.data.estado).toBe("fructificando");
    expect(new Date(json.data.fechaInicioFructificacion).toISOString()).toBe(fecha);
  });

  it("usa diasEsperadosDefault.fructificacion del hongo si no se manda explicito", async () => {
    const fungusType = await makeFungusType({
      userId: user._id,
      headers,
      diasEsperadosDefault: { inoculacionGrano: 14, incubacion: 20, fructificacion: 33 },
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

    const fructificado = await fructificarRecipiente(recipiente._id, { userId: user._id, headers });
    expect(fructificado.diasEsperadosFructificacion).toBe(33);
  });

  it("409 si el recipiente no esta 'incubando'", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars, { userId: user._id, headers });
    const recipiente = await makeRecipiente({ userId: user._id, headers, batchId: batch._id, origenFrascoIds: [jarId] });
    await fructificarRecipiente(recipiente._id, { userId: user._id, headers });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      params: { id: recipiente._id },
      body: { fechaInicioFructificacion: new Date().toISOString() },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/incubando/i);
  });
});
