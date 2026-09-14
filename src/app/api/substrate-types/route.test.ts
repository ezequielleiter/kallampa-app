import { describe, it, expect } from "vitest";
import { GET, POST } from "./route";
import { PATCH } from "./[id]/route";
import { callRoute } from "@/test-utils/api-test-helpers";

describe("catalogo substrate-types", () => {
  it("crea un tipo de sustrato", async () => {
    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: { nombre: "Paja de trigo" },
    });
    expect(status).toBe(201);
    expect(json.data.nombre).toBe("Paja de trigo");
    expect(json.data.activo).toBe(true);
  });

  it("rechaza nombre duplicado con 409", async () => {
    await callRoute(POST, { method: "POST", body: { nombre: "Paja de trigo" } });
    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: { nombre: "Paja de trigo" },
    });
    expect(status).toBe(409);
    expect(json.error).toMatch(/ya existe/i);
  });

  it("PATCH {activo:false} es un soft-delete", async () => {
    const { json: created } = await callRoute(POST, {
      method: "POST",
      body: { nombre: "Paja de trigo" },
    });

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: created.data._id },
      body: { activo: false },
    });

    expect(status).toBe(200);
    expect(json.data.activo).toBe(false);

    const { json: listado } = await callRoute(GET, { searchParams: { activo: "true" } });
    expect(listado.data).toHaveLength(0);
  });
});
