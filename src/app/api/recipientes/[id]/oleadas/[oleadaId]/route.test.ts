import { describe, it, expect } from "vitest";
import { PATCH, DELETE } from "./route";
import { POST as addOleada } from "../route";
import {
  callRoute,
  makeBatch,
  colonizarJars,
  makeRecipiente,
  fructificarRecipiente,
} from "@/test-utils/api-test-helpers";

async function setupRecipienteConOleada() {
  const batch = await makeBatch({ cantidadFrascos: 1 });
  const [jarId] = await colonizarJars(batch.jars);
  const recipiente = await makeRecipiente({ batchId: batch._id, origenFrascoIds: [jarId] });
  await fructificarRecipiente(recipiente._id);

  const { json } = await callRoute(addOleada, {
    method: "POST",
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
      params: { id: recipienteId, oleadaId },
    });

    expect(status).toBe(200);
    expect(json.data.oleadas).toHaveLength(0);
  });
});
