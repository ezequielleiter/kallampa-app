import { describe, it, expect } from "vitest";
import { GET, PATCH } from "./route";
import { callRoute, makeBatch, makeFungusType } from "@/test-utils/api-test-helpers";

describe("GET /api/jars/[id]", () => {
  it("devuelve el jar con su batch y el hongo poblados", async () => {
    const fungusType = await makeFungusType({
      diasEsperadosDefault: { inoculacionGrano: 14, incubacion: 20, fructificacion: 10 },
    });
    const batch = await makeBatch({ fungusTypeId: fungusType._id, cantidadFrascos: 1 });
    const jarId = batch.jars[0]._id;

    const { status, json } = await callRoute(GET, { params: { id: jarId } });

    expect(status).toBe(200);
    expect(json.data.numeroGuia).toBe(batch.jars[0].numeroGuia);
    expect(json.data.batch.numeroLote).toBe(batch.numeroLote);
    expect(json.data.batch.fungusTypeId.nombre).toBe(fungusType.nombre);
  });

  it("404 en un frasco inexistente", async () => {
    const { status } = await callRoute(GET, { params: { id: "507f1f77bcf86cd799439011" } });
    expect(status).toBe(404);
  });
});

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
