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

describe("catalogo substrate-types", () => {
  it("crea un tipo de sustrato", async () => {
    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { nombre: "Paja de trigo" },
    });
    expect(status).toBe(201);
    expect(json.data.nombre).toBe("Paja de trigo");
    expect(json.data.activo).toBe(true);
  });

  it("rechaza nombre duplicado con 409", async () => {
    await callRoute(POST, { method: "POST", headers, body: { nombre: "Paja de trigo" } });
    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { nombre: "Paja de trigo" },
    });
    expect(status).toBe(409);
    expect(json.error).toMatch(/ya existe/i);
  });

  it("PATCH {activo:false} es un soft-delete", async () => {
    const { json: created } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { nombre: "Paja de trigo" },
    });

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: created.data._id },
      body: { activo: false },
    });

    expect(status).toBe(200);
    expect(json.data.activo).toBe(false);

    const { json: listado } = await callRoute(GET, { headers, searchParams: { activo: "true" } });
    expect(listado.data).toHaveLength(0);
  });
});
