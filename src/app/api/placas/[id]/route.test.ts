import { describe, it, expect } from "vitest";
import { PATCH } from "./route";
import { callRoute, makeClonacion } from "@/test-utils/api-test-helpers";

describe("PATCH /api/placas/[id]", () => {
  it("cambia el estado de una placa", async () => {
    const clonacion = await makeClonacion({ cantidadPlacas: 1 });
    const placaId = clonacion.placas[0]._id;

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: placaId },
      body: { estado: "colonizado" },
    });

    expect(status).toBe(200);
    expect(json.data.estado).toBe("colonizado");
  });

  it("404 en una placa inexistente", async () => {
    const { status } = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: "507f1f77bcf86cd799439011" },
      body: { estado: "contaminado" },
    });

    expect(status).toBe(404);
  });
});
