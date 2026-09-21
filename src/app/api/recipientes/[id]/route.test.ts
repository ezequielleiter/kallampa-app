import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "./route";
import {
  callRoute,
  makeBatch,
  makeFungusType,
  colonizarJars,
  makeRecipiente,
  makeUser,
  authHeaders,
} from "@/test-utils/api-test-helpers";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

describe("GET /api/recipientes/[id]", () => {
  it("devuelve el recipiente con su batch y el hongo poblados", async () => {
    const fungusType = await makeFungusType({
      userId: user._id,
      headers,
      diasEsperadosDefault: { inoculacionGrano: 14, incubacion: 20, fructificacion: 10 },
    });
    const batch = await makeBatch({ userId: user._id, headers, fungusTypeId: fungusType._id, cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars, { userId: user._id, headers });
    const recipiente = await makeRecipiente({ userId: user._id, headers, batchId: batch._id, origenFrascoIds: [jarId] });

    const { status, json } = await callRoute(GET, { headers, params: { id: recipiente._id } });

    expect(status).toBe(200);
    expect(json.data.numeroSeguimiento).toBe(recipiente.numeroSeguimiento);
    expect(json.data.batch.numeroLote).toBe(batch.numeroLote);
    expect(json.data.batch.fungusTypeId.nombre).toBe(fungusType.nombre);
  });

  it("404 en un recipiente inexistente", async () => {
    const { status } = await callRoute(GET, { headers, params: { id: "507f1f77bcf86cd799439011" } });
    expect(status).toBe(404);
  });
});
