import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "./route";
import { callRoute, makeBatch, colonizarJars, makeUser, authHeaders } from "@/test-utils/api-test-helpers";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

describe("GET /api/jars", () => {
  it("?batchId= lista solo los frascos de ese lote", async () => {
    const b1 = await makeBatch({ userId: user._id, headers, cantidadFrascos: 2 });
    const b2 = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });

    const { status, json } = await callRoute(GET, { headers, searchParams: { batchId: b1._id } });
    expect(status).toBe(200);
    expect(json.data).toHaveLength(2);
    expect(json.data.every((j: { batchId: string }) => String(j.batchId) === b1._id)).toBe(true);

    const { json: json2 } = await callRoute(GET, { headers, searchParams: { batchId: b2._id } });
    expect(json2.data).toHaveLength(1);
  });

  it("?estado= filtra por estado (usado para el selector de origen al crear un recipiente)", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 3 });
    await colonizarJars([batch.jars[0], batch.jars[1]], { userId: user._id, headers });

    const { json } = await callRoute(GET, {
      headers,
      searchParams: { batchId: batch._id, estado: "colonizado" },
    });
    expect(json.data).toHaveLength(2);

    const { json: colonizando } = await callRoute(GET, {
      headers,
      searchParams: { batchId: batch._id, estado: "colonizando" },
    });
    expect(colonizando.data).toHaveLength(1);
  });

  it("?estado= acepta una lista separada por comas (usada por el selector de origen: colonizado o ya usado)", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 3 });
    await colonizarJars([batch.jars[0], batch.jars[1]], { userId: user._id, headers });

    const { PATCH } = await import("@/app/api/jars/[id]/route");
    await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: batch.jars[1]._id },
      body: { estado: "usado" },
    });

    const { json } = await callRoute(GET, {
      headers,
      searchParams: { batchId: batch._id, estado: "colonizado,usado" },
    });
    expect(json.data).toHaveLength(2);
    expect(json.data.map((j: { estado: string }) => j.estado).sort()).toEqual([
      "colonizado",
      "usado",
    ]);
  });

  it("sin filtros devuelve todos los frascos", async () => {
    await makeBatch({ userId: user._id, headers, cantidadFrascos: 2 });
    await makeBatch({ userId: user._id, headers, cantidadFrascos: 3 });

    const { json } = await callRoute(GET, { headers });
    expect(json.data).toHaveLength(5);
  });
});
