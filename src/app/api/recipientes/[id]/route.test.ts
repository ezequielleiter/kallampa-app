import { describe, it, expect } from "vitest";
import { GET } from "./route";
import {
  callRoute,
  makeBatch,
  makeFungusType,
  colonizarJars,
  makeRecipiente,
} from "@/test-utils/api-test-helpers";

describe("GET /api/recipientes/[id]", () => {
  it("devuelve el recipiente con su batch y el hongo poblados", async () => {
    const fungusType = await makeFungusType({
      diasEsperadosDefault: { inoculacionGrano: 14, incubacion: 20, fructificacion: 10 },
    });
    const batch = await makeBatch({ fungusTypeId: fungusType._id, cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars);
    const recipiente = await makeRecipiente({ batchId: batch._id, origenFrascoIds: [jarId] });

    const { status, json } = await callRoute(GET, { params: { id: recipiente._id } });

    expect(status).toBe(200);
    expect(json.data.numeroSeguimiento).toBe(recipiente.numeroSeguimiento);
    expect(json.data.batch.numeroLote).toBe(batch.numeroLote);
    expect(json.data.batch.fungusTypeId.nombre).toBe(fungusType.nombre);
  });

  it("404 en un recipiente inexistente", async () => {
    const { status } = await callRoute(GET, { params: { id: "507f1f77bcf86cd799439011" } });
    expect(status).toBe(404);
  });
});
