import { describe, it, expect } from "vitest";
import { POST } from "./route";
import {
  callRoute,
  makeBatch,
  colonizarJars,
  makeRecipiente,
  fructificarRecipiente,
} from "@/test-utils/api-test-helpers";

describe("POST /api/recipientes/[id]/oleadas", () => {
  it("agrega una oleada cuando el recipiente esta 'fructificando'", async () => {
    const batch = await makeBatch({ cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars);
    const recipiente = await makeRecipiente({ batchId: batch._id, origenFrascoIds: [jarId] });
    await fructificarRecipiente(recipiente._id);

    const { status, json } = await callRoute(POST, {
      method: "POST",
      params: { id: recipiente._id },
      body: { fecha: new Date().toISOString(), pesoKg: 3.5 },
    });

    expect(status).toBe(201);
    expect(json.data.oleadas).toHaveLength(1);
    expect(json.data.oleadas[0].pesoKg).toBe(3.5);
  });

  it("409 si el recipiente todavia esta 'incubando'", async () => {
    const batch = await makeBatch({ cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars);
    const recipiente = await makeRecipiente({ batchId: batch._id, origenFrascoIds: [jarId] });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      params: { id: recipiente._id },
      body: { fecha: new Date().toISOString(), pesoKg: 3.5 },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/fructificando/i);
  });
});
