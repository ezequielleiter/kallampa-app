import { describe, it, expect } from "vitest";
import { POST as discard } from "./route";
import { POST as advanceStage } from "../advance-stage/route";
import { callRoute, makeBatch, advanceToCosecha } from "@/test-utils/api-test-helpers";

describe("POST /api/batches/[id]/discard", () => {
  it("descarta un lote activo correctamente", async () => {
    const batch = await makeBatch();

    const { status, json } = await callRoute(discard, {
      method: "POST",
      params: { id: batch._id },
      body: { motivo: "Contaminacion visible en el frasco" },
    });

    expect(status).toBe(200);
    expect(json.data.estado).toBe("descartado");
    expect(json.data.descartado).toBe(true);
    expect(json.data.motivoDescarte).toBe("Contaminacion visible en el frasco");
  });

  it("bloquea el descarte si el lote ya esta 'finalizado' (409)", async () => {
    const batch = await makeBatch();
    const afterCosecha = await advanceToCosecha(batch._id);
    const { json: finalizado } = await callRoute(advanceStage, {
      method: "POST",
      params: { id: afterCosecha._id },
      body: { targetStage: "finalizado" },
    });
    expect(finalizado.data.estado).toBe("finalizado");

    const { status, json } = await callRoute(discard, {
      method: "POST",
      params: { id: batch._id },
      body: { motivo: "Intento de descarte invalido" },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/finalizado/i);
  });

  it("bloquea el descarte si el lote ya esta 'descartado' (409)", async () => {
    const batch = await makeBatch();
    await callRoute(discard, {
      method: "POST",
      params: { id: batch._id },
      body: { motivo: "Primer descarte" },
    });

    const { status, json } = await callRoute(discard, {
      method: "POST",
      params: { id: batch._id },
      body: { motivo: "Segundo intento de descarte" },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/descartado/i);
  });
});
