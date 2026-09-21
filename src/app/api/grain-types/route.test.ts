import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { PATCH } from "./[id]/route";
import { callRoute, makeUser, authHeaders } from "@/test-utils/api-test-helpers";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

describe("catalogo grain-types", () => {
  it("crea un tipo de grano", async () => {
    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { nombre: "Trigo" },
    });
    expect(status).toBe(201);
    expect(json.data.nombre).toBe("Trigo");
    expect(json.data.activo).toBe(true);
  });

  it("rechaza nombre duplicado con 409", async () => {
    await callRoute(POST, { method: "POST", headers, body: { nombre: "Trigo" } });
    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { nombre: "Trigo" },
    });
    expect(status).toBe(409);
    expect(json.error).toMatch(/ya existe/i);
  });

  it("lista los tipos de grano creados", async () => {
    await callRoute(POST, { method: "POST", headers, body: { nombre: "Trigo" } });
    await callRoute(POST, { method: "POST", headers, body: { nombre: "Sorgo" } });

    const { json } = await callRoute(GET, { headers });
    expect(json.data).toHaveLength(2);
  });

  it("PATCH {activo:false} es un soft-delete, nunca hay DELETE fisico", async () => {
    const { json: created } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { nombre: "Trigo" },
    });

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: created.data._id },
      body: { activo: false },
    });

    expect(status).toBe(200);
    expect(json.data.activo).toBe(false);

    // Sigue existiendo en la coleccion (no borrado fisico).
    const { json: listado } = await callRoute(GET, { headers, searchParams: { activo: "false" } });
    expect(listado.data).toHaveLength(1);
    expect(listado.data[0]._id).toBe(created.data._id);
  });
});
