import { describe, it, expect } from "vitest";
import { GET, POST } from "./route";
import { callRoute } from "@/test-utils/api-test-helpers";

const DIAS = {
  inoculacionGrano: 14,
  crecimientoSustrato: 20,
  fructificacion: 10,
  cosecha: 15,
};

describe("POST /api/fungus-types", () => {
  it("crea un tipo de hongo", async () => {
    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: { nombre: "Girgola", diasEsperadosDefault: DIAS },
    });

    expect(status).toBe(201);
    expect(json.data.nombre).toBe("Girgola");
    expect(json.data.activo).toBe(true);
    expect(json.data.diasEsperadosDefault).toEqual(DIAS);
  });

  it("rechaza un nombre duplicado con 409", async () => {
    await callRoute(POST, {
      method: "POST",
      body: { nombre: "Girgola", diasEsperadosDefault: DIAS },
    });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: { nombre: "Girgola", diasEsperadosDefault: DIAS },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/ya existe/i);
  });
});

describe("GET /api/fungus-types", () => {
  it("lista los tipos de hongo creados", async () => {
    await callRoute(POST, { method: "POST", body: { nombre: "Girgola", diasEsperadosDefault: DIAS } });
    await callRoute(POST, { method: "POST", body: { nombre: "Reishi", diasEsperadosDefault: DIAS } });

    const { status, json } = await callRoute(GET);
    expect(status).toBe(200);
    expect(json.data).toHaveLength(2);
  });
});
