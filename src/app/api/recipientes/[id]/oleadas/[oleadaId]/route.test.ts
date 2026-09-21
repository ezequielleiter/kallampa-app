import { describe, it, expect, beforeEach } from "vitest";
import { PATCH, DELETE } from "./route";
import { POST as addOleada } from "../route";
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

async function setupRecipienteConOleada() {
  const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
  const [jarId] = await colonizarJars(batch.jars, { userId: user._id, headers });
  const recipiente = await makeRecipiente({ userId: user._id, headers, batchId: batch._id, origenFrascoIds: [jarId] });
  await fructificarRecipiente(recipiente._id, { userId: user._id, headers });

  const { json } = await callRoute(addOleada, {
    method: "POST",
    headers,
    params: { id: recipiente._id },
    body: { fecha: new Date().toISOString(), pesoKg: 2 },
  });
  return { recipienteId: recipiente._id, oleadaId: json.data.oleadas[0]._id };
}

describe("PATCH /api/recipientes/[id]/oleadas/[oleadaId]", () => {
  it("edita una oleada existente", async () => {
    const { recipienteId, oleadaId } = await setupRecipienteConOleada();

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: recipienteId, oleadaId },
      body: { pesoKg: 9 },
    });

    expect(status).toBe(200);
    expect(json.data.oleadas[0].pesoKg).toBe(9);
  });

  it("404 en una oleada inexistente", async () => {
    const { recipienteId } = await setupRecipienteConOleada();

    const { status } = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: recipienteId, oleadaId: "507f1f77bcf86cd799439011" },
      body: { pesoKg: 9 },
    });

    expect(status).toBe(404);
  });
});

describe("DELETE /api/recipientes/[id]/oleadas/[oleadaId]", () => {
  it("elimina una oleada", async () => {
    const { recipienteId, oleadaId } = await setupRecipienteConOleada();

    const { status, json } = await callRoute(DELETE, {
      method: "DELETE",
      headers,
      params: { id: recipienteId, oleadaId },
    });

    expect(status).toBe(200);
    expect(json.data.oleadas).toHaveLength(0);
  });
});
