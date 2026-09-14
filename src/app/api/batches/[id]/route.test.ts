import { describe, it, expect } from "vitest";
import { GET } from "./route";
import { callRoute, makeBatch } from "@/test-utils/api-test-helpers";

const NONEXISTENT_ID = "507f1f77bcf86cd799439011";

describe("GET /api/batches/[id]", () => {
  it("devuelve el detalle del batch con sus jars", async () => {
    const batch = await makeBatch({ cantidadFrascos: 2 });

    const { status, json } = await callRoute(GET, { params: { id: batch._id } });

    expect(status).toBe(200);
    expect(json.data.numeroLote).toBe(batch.numeroLote);
    expect(json.data.jars).toHaveLength(2);
  });

  it("404 en un id inexistente", async () => {
    const { status, json } = await callRoute(GET, { params: { id: NONEXISTENT_ID } });

    expect(status).toBe(404);
    expect(json.error).toMatch(/no encontrado/i);
  });
});
