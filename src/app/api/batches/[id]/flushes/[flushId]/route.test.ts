import { describe, it, expect } from "vitest";
import { PATCH, DELETE } from "./route";
import { POST as addFlush } from "../route";
import { callRoute, makeBatch, advanceToCosecha } from "@/test-utils/api-test-helpers";

async function makeBatchWithFlush() {
  const batch = await makeBatch();
  await advanceToCosecha(batch._id);
  const { json } = await callRoute(addFlush, {
    method: "POST",
    params: { id: batch._id },
    body: { numero: 1, fecha: new Date().toISOString(), pesoKg: 4 },
  });
  const flushId = json.data.oleadas[0]._id;
  return { batchId: batch._id, flushId };
}

describe("PATCH /api/batches/[id]/flushes/[flushId]", () => {
  it("actualiza los campos de una oleada puntual", async () => {
    const { batchId, flushId } = await makeBatchWithFlush();

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: batchId, flushId },
      body: { pesoKg: 9.9, notas: "corregido" },
    });

    expect(status).toBe(200);
    const oleada = json.data.oleadas.find((o: { _id: string }) => o._id === flushId);
    expect(oleada.pesoKg).toBe(9.9);
    expect(oleada.notas).toBe("corregido");
  });

  it("404 si la oleada no existe", async () => {
    const batch = await makeBatch();
    await advanceToCosecha(batch._id);

    const { status } = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: batch._id, flushId: "507f1f77bcf86cd799439011" },
      body: { pesoKg: 1 },
    });

    expect(status).toBe(404);
  });
});

describe("DELETE /api/batches/[id]/flushes/[flushId]", () => {
  it("elimina una oleada puntual por flushId", async () => {
    const { batchId, flushId } = await makeBatchWithFlush();

    const { status, json } = await callRoute(DELETE, {
      method: "DELETE",
      params: { id: batchId, flushId },
    });

    expect(status).toBe(200);
    expect(json.data.oleadas).toHaveLength(0);
  });
});
