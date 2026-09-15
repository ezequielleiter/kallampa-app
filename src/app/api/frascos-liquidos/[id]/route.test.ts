import { describe, it, expect } from "vitest";
import { PATCH } from "./route";
import { callRoute, makeClonacion, colonizarPlacas, makeFrascoLiquido } from "@/test-utils/api-test-helpers";

describe("PATCH /api/frascos-liquidos/[id]", () => {
  it("cambia el estado de un frasco liquido", async () => {
    const clonacion = await makeClonacion({ cantidadPlacas: 1 });
    const [placaId] = await colonizarPlacas([clonacion.placas[0]]);
    const frasco = await makeFrascoLiquido({ origenPlacaId: placaId });

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: frasco._id },
      body: { estado: "contaminado" },
    });

    expect(status).toBe(200);
    expect(json.data.estado).toBe("contaminado");
  });

  it("404 en un frasco liquido inexistente", async () => {
    const { status } = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: "507f1f77bcf86cd799439011" },
      body: { estado: "contaminado" },
    });

    expect(status).toBe(404);
  });
});
