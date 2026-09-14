import { describe, it, expect } from "vitest";
import { PATCH } from "./route";
import { makeFungusType, callRoute } from "@/test-utils/api-test-helpers";

describe("PATCH /api/fungus-types/[id]", () => {
  it("soft-delete: PATCH {activo:false} desactiva sin borrar el documento", async () => {
    const fungusType = await makeFungusType();

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: fungusType._id },
      body: { activo: false },
    });

    expect(status).toBe(200);
    expect(json.data.activo).toBe(false);
    expect(json.data._id).toBe(fungusType._id);
  });

  it("merge parcial de diasEsperadosDefault: mandar 1 de los 3 campos no pisa los otros 2", async () => {
    const fungusType = await makeFungusType({
      diasEsperadosDefault: { inoculacionGrano: 14, incubacion: 20, fructificacion: 10 },
    });

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: fungusType._id },
      body: { diasEsperadosDefault: { fructificacion: 99 } },
    });

    expect(status).toBe(200);
    expect(json.data.diasEsperadosDefault).toEqual({
      inoculacionGrano: 14,
      incubacion: 20,
      fructificacion: 99,
    });
  });

  it("404 en un id inexistente", async () => {
    const { status } = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: "507f1f77bcf86cd799439011" },
      body: { activo: false },
    });

    expect(status).toBe(404);
  });
});
