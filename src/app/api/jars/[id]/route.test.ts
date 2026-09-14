import { describe, it, expect } from "vitest";
import { PATCH } from "./route";
import { callRoute, makeBatch } from "@/test-utils/api-test-helpers";

describe("PATCH /api/jars/[id]", () => {
  it("cambia el estado de un frasco", async () => {
    const batch = await makeBatch({ cantidadFrascos: 1 });
    const jarId = batch.jars[0]._id;

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: jarId },
      body: { estado: "colonizado" },
    });

    expect(status).toBe(200);
    expect(json.data.estado).toBe("colonizado");
  });

  it("404 en un frasco inexistente", async () => {
    const { status } = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: "507f1f77bcf86cd799439011" },
      body: { estado: "contaminado" },
    });

    expect(status).toBe(404);
  });
});
