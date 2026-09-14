import { describe, it, expect } from "vitest";
import { POST } from "./route";
import { callRoute, makeBatch, colonizarJars, makeRecipiente } from "@/test-utils/api-test-helpers";

describe("POST /api/recipientes/[id]/estado", () => {
  it("marca el recipiente como 'contaminado' con motivo opcional", async () => {
    const batch = await makeBatch({ cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars);
    const recipiente = await makeRecipiente({ batchId: batch._id, origenFrascoIds: [jarId] });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      params: { id: recipiente._id },
      body: { estado: "contaminado", motivo: "Se vio moco verde" },
    });

    expect(status).toBe(200);
    expect(json.data.estado).toBe("contaminado");
    expect(json.data.motivoPerdida).toBe("Se vio moco verde");
  });

  it("motivo es opcional", async () => {
    const batch = await makeBatch({ cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars);
    const recipiente = await makeRecipiente({ batchId: batch._id, origenFrascoIds: [jarId] });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      params: { id: recipiente._id },
      body: { estado: "descartado" },
    });

    expect(status).toBe(200);
    expect(json.data.estado).toBe("descartado");
  });

  it("409 si ya esta en un estado terminal", async () => {
    const batch = await makeBatch({ cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars);
    const recipiente = await makeRecipiente({ batchId: batch._id, origenFrascoIds: [jarId] });

    await callRoute(POST, {
      method: "POST",
      params: { id: recipiente._id },
      body: { estado: "descartado" },
    });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      params: { id: recipiente._id },
      body: { estado: "finalizado" },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/terminal/i);
  });
});
