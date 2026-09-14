import { describe, it, expect } from "vitest";
import { GET, POST } from "./route";
import { PATCH } from "./[id]/route";
import { callRoute } from "@/test-utils/api-test-helpers";

describe("catalogo grain-types", () => {
  it("crea un tipo de grano", async () => {
    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: { nombre: "Trigo" },
    });
    expect(status).toBe(201);
    expect(json.data.nombre).toBe("Trigo");
    expect(json.data.activo).toBe(true);
  });

  it("rechaza nombre duplicado con 409", async () => {
    await callRoute(POST, { method: "POST", body: { nombre: "Trigo" } });
    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: { nombre: "Trigo" },
    });
    expect(status).toBe(409);
    expect(json.error).toMatch(/ya existe/i);
  });

  it("lista los tipos de grano creados", async () => {
    await callRoute(POST, { method: "POST", body: { nombre: "Trigo" } });
    await callRoute(POST, { method: "POST", body: { nombre: "Sorgo" } });

    const { json } = await callRoute(GET);
    expect(json.data).toHaveLength(2);
  });

  it("PATCH {activo:false} es un soft-delete, nunca hay DELETE fisico", async () => {
    const { json: created } = await callRoute(POST, {
      method: "POST",
      body: { nombre: "Trigo" },
    });

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: created.data._id },
      body: { activo: false },
    });

    expect(status).toBe(200);
    expect(json.data.activo).toBe(false);

    // Sigue existiendo en la coleccion (no borrado fisico).
    const { json: listado } = await callRoute(GET, { searchParams: { activo: "false" } });
    expect(listado.data).toHaveLength(1);
    expect(listado.data[0]._id).toBe(created.data._id);
  });
});
