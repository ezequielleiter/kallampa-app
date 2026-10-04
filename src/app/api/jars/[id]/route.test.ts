import { describe, it, expect, beforeEach } from "vitest";
import { GET, PATCH, DELETE } from "./route";
import Batch from "@/models/Batch";
import Jar from "@/models/Jar";
import {
  callRoute,
  makeBatch,
  makeBatchConRecipiente,
  makeClonacionDirecta,
  makeFungusType,
  makeUser,
  authHeaders,
  colonizarJars,
} from "@/test-utils/api-test-helpers";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

describe("GET /api/jars/[id]", () => {
  it("devuelve el jar con su batch y el hongo poblados", async () => {
    const fungusType = await makeFungusType({
      userId: user._id,
      headers,
      diasEsperadosDefault: { inoculacionGrano: 14, incubacion: 20, fructificacion: 10 },
    });
    const batch = await makeBatch({ userId: user._id, headers, fungusTypeId: fungusType._id, cantidadFrascos: 1 });
    const jarId = batch.jars[0]._id;

    const { status, json } = await callRoute(GET, { headers, params: { id: jarId } });

    expect(status).toBe(200);
    expect(json.data.numeroGuia).toBe(batch.jars[0].numeroGuia);
    expect(json.data.batch.numeroLote).toBe(batch.numeroLote);
    expect(json.data.batch.fungusTypeId.nombre).toBe(fungusType.nombre);
  });

  it("404 en un frasco inexistente", async () => {
    const { status } = await callRoute(GET, { headers, params: { id: "507f1f77bcf86cd799439011" } });
    expect(status).toBe(404);
  });
});

describe("PATCH /api/jars/[id]", () => {
  it("cambia el estado de un frasco", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    const jarId = batch.jars[0]._id;

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: jarId },
      body: { estado: "colonizado" },
    });

    expect(status).toBe(200);
    expect(json.data.estado).toBe("colonizado");
  });

  it("404 en un frasco inexistente", async () => {
    const { status } = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: "507f1f77bcf86cd799439011" },
      body: { estado: "contaminado" },
    });

    expect(status).toBe(404);
  });
});

describe("DELETE /api/jars/[id]", () => {
  it("borra el frasco, descuenta cantidadFrascos y no renumera el resto", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 3 });
    const f02 = batch.jars[1];

    const { status } = await callRoute(DELETE, {
      method: "DELETE",
      headers,
      params: { id: f02._id },
    });

    expect(status).toBe(200);
    const restantes = await Jar.find({ batchId: batch._id }).sort({ numeroGuia: 1 }).lean();
    expect(restantes.map((j) => j.numeroGuia)).toEqual([
      `${batch.numeroLote}-F01`,
      `${batch.numeroLote}-F03`,
    ]);
    const actualizado = await Batch.findById(batch._id).lean();
    expect(actualizado!.inoculacionGrano.cantidadFrascos).toBe(2);
  });

  it("409 si el frasco ya se uso en un recipiente", async () => {
    const { batch } = await makeBatchConRecipiente({ userId: user._id, headers });

    const { status, json } = await callRoute(DELETE, {
      method: "DELETE",
      headers,
      params: { id: batch.jars[0]._id },
    });

    expect(status).toBe(409);
    expect(json.code).toBe("frasco_usado_en_recipiente");
    expect(await Jar.countDocuments({ batchId: batch._id })).toBe(1);
  });

  it("409 si el frasco es origen de una clonacion", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars, { userId: user._id, headers });
    await makeClonacionDirecta({ userId: user._id, headers, origenProceso: "frascoGrano", origenJarId: jarId });

    const { status, json } = await callRoute(DELETE, {
      method: "DELETE",
      headers,
      params: { id: jarId },
    });

    expect(status).toBe(409);
    expect(json.code).toBe("frasco_usado_en_clonacion");
  });

  it("404 en un frasco de otro usuario", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    const otro = await makeUser();

    const { status } = await callRoute(DELETE, {
      method: "DELETE",
      headers: authHeaders(otro),
      params: { id: batch.jars[0]._id },
    });

    expect(status).toBe(404);
    expect(await Jar.countDocuments({ batchId: batch._id })).toBe(1);
  });
});
