import { describe, it, expect } from "vitest";
import { GET } from "./route";
import { callRoute, makeBatch, colonizarJars } from "@/test-utils/api-test-helpers";

describe("GET /api/jars", () => {
  it("?batchId= lista solo los frascos de ese lote", async () => {
    const b1 = await makeBatch({ cantidadFrascos: 2 });
    const b2 = await makeBatch({ cantidadFrascos: 1 });

    const { status, json } = await callRoute(GET, { searchParams: { batchId: b1._id } });
    expect(status).toBe(200);
    expect(json.data).toHaveLength(2);
    expect(json.data.every((j: { batchId: string }) => String(j.batchId) === b1._id)).toBe(true);

    const { json: json2 } = await callRoute(GET, { searchParams: { batchId: b2._id } });
    expect(json2.data).toHaveLength(1);
  });

  it("?estado= filtra por estado (usado para el selector de origen al crear un recipiente)", async () => {
    const batch = await makeBatch({ cantidadFrascos: 3 });
    await colonizarJars([batch.jars[0], batch.jars[1]]);

    const { json } = await callRoute(GET, {
      searchParams: { batchId: batch._id, estado: "colonizado" },
    });
    expect(json.data).toHaveLength(2);

    const { json: colonizando } = await callRoute(GET, {
      searchParams: { batchId: batch._id, estado: "colonizando" },
    });
    expect(colonizando.data).toHaveLength(1);
  });

  it("?estado= acepta una lista separada por comas (usada por el selector de origen: colonizado o ya usado)", async () => {
    const batch = await makeBatch({ cantidadFrascos: 3 });
    await colonizarJars([batch.jars[0], batch.jars[1]]);

    const { PATCH } = await import("@/app/api/jars/[id]/route");
    await callRoute(PATCH, {
      method: "PATCH",
      params: { id: batch.jars[1]._id },
      body: { estado: "usado" },
    });

    const { json } = await callRoute(GET, {
      searchParams: { batchId: batch._id, estado: "colonizado,usado" },
    });
    expect(json.data).toHaveLength(2);
    expect(json.data.map((j: { estado: string }) => j.estado).sort()).toEqual([
      "colonizado",
      "usado",
    ]);
  });

  it("sin filtros devuelve todos los frascos", async () => {
    await makeBatch({ cantidadFrascos: 2 });
    await makeBatch({ cantidadFrascos: 3 });

    const { json } = await callRoute(GET);
    expect(json.data).toHaveLength(5);
  });
});
