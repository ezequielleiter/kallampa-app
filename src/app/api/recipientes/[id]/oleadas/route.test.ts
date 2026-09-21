import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "./route";
import {
  callRoute,
  makeBatch,
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

describe("POST /api/recipientes/[id]/oleadas", () => {
  it("agrega una oleada cuando el recipiente esta 'fructificando'", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars, { userId: user._id, headers });
    const recipiente = await makeRecipiente({ userId: user._id, headers, batchId: batch._id, origenFrascoIds: [jarId] });
    await fructificarRecipiente(recipiente._id, { userId: user._id, headers });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      params: { id: recipiente._id },
      body: { fecha: new Date().toISOString(), pesoKg: 3.5 },
    });

    expect(status).toBe(201);
    expect(json.data.oleadas).toHaveLength(1);
    expect(json.data.oleadas[0].pesoKg).toBe(3.5);
  });

  it("409 si el recipiente todavia esta 'incubando'", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars, { userId: user._id, headers });
    const recipiente = await makeRecipiente({ userId: user._id, headers, batchId: batch._id, origenFrascoIds: [jarId] });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      params: { id: recipiente._id },
      body: { fecha: new Date().toISOString(), pesoKg: 3.5 },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/fructificando/i);
  });
});
