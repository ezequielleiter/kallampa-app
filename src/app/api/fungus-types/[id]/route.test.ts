import { describe, it, expect, beforeEach } from "vitest";
import { PATCH } from "./route";
import { makeFungusType, callRoute, makeUser, authHeaders } from "@/test-utils/api-test-helpers";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

describe("PATCH /api/fungus-types/[id]", () => {
  it("soft-delete: PATCH {activo:false} desactiva sin borrar el documento", async () => {
    const fungusType = await makeFungusType({ userId: user._id, headers });

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: fungusType._id },
      body: { activo: false },
    });

    expect(status).toBe(200);
    expect(json.data.activo).toBe(false);
    expect(json.data._id).toBe(fungusType._id);
  });

  it("merge parcial de diasEsperadosDefault: mandar 1 de los 3 campos no pisa los otros 2", async () => {
    const fungusType = await makeFungusType({
      userId: user._id,
      headers,
      diasEsperadosDefault: { inoculacionGrano: 14, incubacion: 20, fructificacion: 10 },
    });

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      headers,
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
      headers,
      params: { id: "507f1f77bcf86cd799439011" },
      body: { activo: false },
    });

    expect(status).toBe(404);
  });

  it("rechaza cambiar iniciales a una que ya usa otro hongo activo con 409", async () => {
    await makeFungusType({ userId: user._id, headers, iniciales: "OST" });
    const otro = await makeFungusType({ userId: user._id, headers, iniciales: "REI" });

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: otro._id },
      body: { iniciales: "OST" },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/iniciales/i);
  });

  it("rechaza reactivar un hongo cuyas iniciales colisionan con un hongo activo con 409", async () => {
    const original = await makeFungusType({ userId: user._id, headers, iniciales: "OST" });
    await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: original._id },
      body: { activo: false },
    });
    // Ahora que "OST" quedo libre (el original esta inactivo), otro hongo
    // puede crearse con esas mismas iniciales.
    await makeFungusType({ userId: user._id, headers, iniciales: "OST" });

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: original._id },
      body: { activo: true },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/iniciales/i);
  });

  it("permite cambiar iniciales a un valor unico", async () => {
    const fungusType = await makeFungusType({ userId: user._id, headers, iniciales: "OST" });

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: fungusType._id },
      body: { iniciales: "REI" },
    });

    expect(status).toBe(200);
    expect(json.data.iniciales).toBe("REI");
  });

  it("permite un PATCH que manda las mismas iniciales que ya tenia", async () => {
    const fungusType = await makeFungusType({ userId: user._id, headers, iniciales: "OST" });

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: fungusType._id },
      body: { iniciales: "OST" },
    });

    expect(status).toBe(200);
    expect(json.data.iniciales).toBe("OST");
  });
});
