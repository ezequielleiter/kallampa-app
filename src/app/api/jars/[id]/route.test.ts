import { describe, it, expect, beforeEach } from "vitest";
import { GET, PATCH } from "./route";
import { callRoute, makeBatch, makeFungusType, makeUser, authHeaders } from "@/test-utils/api-test-helpers";

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
