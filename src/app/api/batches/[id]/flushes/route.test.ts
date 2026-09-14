import { describe, it, expect } from "vitest";
import { POST as addFlush } from "./route";
import { callRoute, makeBatch, advanceToCosecha } from "@/test-utils/api-test-helpers";

describe("POST /api/batches/[id]/flushes", () => {
  it("409 si el lote no esta en etapa 'cosecha'", async () => {
    const batch = await makeBatch();

    const { status, json } = await callRoute(addFlush, {
      method: "POST",
      params: { id: batch._id },
      body: { numero: 1, fecha: new Date().toISOString(), pesoKg: 2 },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/cosecha/i);
  });

  it("agrega una oleada correctamente cuando el lote esta en 'cosecha'", async () => {
    const batch = await makeBatch();
    await advanceToCosecha(batch._id);

    const { status, json } = await callRoute(addFlush, {
      method: "POST",
      params: { id: batch._id },
      body: { numero: 1, fecha: new Date().toISOString(), pesoKg: 3.5 },
    });

    expect(status).toBe(201);
    expect(json.data.oleadas).toHaveLength(1);
    expect(json.data.oleadas[0].pesoKg).toBe(3.5);
  });
});
