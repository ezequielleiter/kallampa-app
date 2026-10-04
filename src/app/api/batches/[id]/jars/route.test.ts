import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "./route";
import { DELETE } from "@/app/api/jars/[id]/route";
import Batch from "@/models/Batch";
import Jar from "@/models/Jar";
import { callRoute, makeBatch, makeUser, authHeaders } from "@/test-utils/api-test-helpers";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

describe("POST /api/batches/[id]/jars", () => {
  it("agrega frascos continuando la numeracion y actualiza cantidadFrascos", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 2 });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      params: { id: batch._id },
      body: { cantidad: 3 },
    });

    expect(status).toBe(201);
    expect(json.data.map((j: { numeroGuia: string }) => j.numeroGuia)).toEqual([
      `${batch.numeroLote}-F03`,
      `${batch.numeroLote}-F04`,
      `${batch.numeroLote}-F05`,
    ]);
    expect(json.data.every((j: { estado: string }) => j.estado === "colonizando")).toBe(true);

    const actualizado = await Batch.findById(batch._id).lean();
    expect(actualizado!.inoculacionGrano.cantidadFrascos).toBe(5);
    expect(await Jar.countDocuments({ batchId: batch._id })).toBe(5);
  });

  it("sigue tras el numero mas alto sin rellenar huecos de frascos borrados", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 3 });
    const f02 = batch.jars.find((j: { numeroGuia: string }) => j.numeroGuia.endsWith("-F02"));
    await callRoute(DELETE, { method: "DELETE", headers, params: { id: f02._id } });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      params: { id: batch._id },
      body: { cantidad: 1 },
    });

    expect(status).toBe(201);
    expect(json.data[0].numeroGuia).toBe(`${batch.numeroLote}-F04`);
  });

  it("400 con una cantidad invalida", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    for (const cantidad of [0, -2, 1.5]) {
      const { status } = await callRoute(POST, {
        method: "POST",
        headers,
        params: { id: batch._id },
        body: { cantidad },
      });
      expect(status).toBe(400);
    }
  });

  it("404 en un lote de otro usuario", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    const otro = await makeUser();

    const { status } = await callRoute(POST, {
      method: "POST",
      headers: authHeaders(otro),
      params: { id: batch._id },
      body: { cantidad: 1 },
    });

    expect(status).toBe(404);
    expect(await Jar.countDocuments({ batchId: batch._id })).toBe(1);
  });
});
