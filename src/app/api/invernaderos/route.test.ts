import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { PATCH } from "./[id]/route";
import {
  callRoute,
  makeUser,
  authHeaders,
  makeInvernadero,
} from "@/test-utils/api-test-helpers";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

describe("invernaderos", () => {
  it("crea un invernadero con sus medidas en metros", async () => {
    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { nombre: "Carpa 1", altoM: 2.5, largoM: 6, profundidadM: 3 },
    });
    expect(status).toBe(201);
    expect(json.data).toMatchObject({
      nombre: "Carpa 1",
      altoM: 2.5,
      largoM: 6,
      profundidadM: 3,
      activo: true,
    });
  });

  it("rechaza medidas en 0 o negativas y nombre vacio con 400", async () => {
    for (const body of [
      { nombre: "Carpa", altoM: 0, largoM: 6, profundidadM: 3 },
      { nombre: "Carpa", altoM: 2, largoM: -1, profundidadM: 3 },
      { nombre: "Carpa", altoM: 2, largoM: 6 },
      { nombre: "  ", altoM: 2, largoM: 6, profundidadM: 3 },
    ]) {
      const { status } = await callRoute(POST, { method: "POST", headers, body });
      expect(status).toBe(400);
    }
  });

  it("rechaza nombre duplicado con 409", async () => {
    await makeInvernadero({ userId: user._id, headers, nombre: "Carpa 1" });
    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { nombre: "Carpa 1", altoM: 2, largoM: 2, profundidadM: 2 },
    });
    expect(status).toBe(409);
    expect(json.code).toBe("invernadero_nombre_en_uso");
  });

  it("lista ordenado por nombre y filtra por activo", async () => {
    await makeInvernadero({ userId: user._id, headers, nombre: "Carpa B" });
    const a = await makeInvernadero({ userId: user._id, headers, nombre: "Carpa A" });
    await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: a._id },
      body: { activo: false },
    });

    const todos = await callRoute(GET, { headers });
    expect(todos.json.data.map((i: { nombre: string }) => i.nombre)).toEqual([
      "Carpa A",
      "Carpa B",
    ]);

    const activos = await callRoute(GET, { headers, searchParams: { activo: "true" } });
    expect(activos.json.data.map((i: { nombre: string }) => i.nombre)).toEqual(["Carpa B"]);
  });

  it("PATCH edita medidas y desactiva (sin DELETE fisico)", async () => {
    const inv = await makeInvernadero({ userId: user._id, headers });
    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: inv._id },
      body: { altoM: 3.2, activo: false },
    });
    expect(status).toBe(200);
    expect(json.data.altoM).toBe(3.2);
    expect(json.data.largoM).toBe(6);
    expect(json.data.activo).toBe(false);
  });

  it("PATCH rechaza renombrar a un nombre en uso con 409", async () => {
    await makeInvernadero({ userId: user._id, headers, nombre: "Carpa 1" });
    const otro = await makeInvernadero({ userId: user._id, headers, nombre: "Carpa 2" });
    const { status } = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: otro._id },
      body: { nombre: "Carpa 1" },
    });
    expect(status).toBe(409);
  });

  it("aisla los invernaderos por cuenta", async () => {
    const inv = await makeInvernadero({ userId: user._id, headers });
    const otro = await makeUser();
    const otroHeaders = authHeaders(otro);

    const lista = await callRoute(GET, { headers: otroHeaders });
    expect(lista.json.data).toHaveLength(0);

    const { status } = await callRoute(PATCH, {
      method: "PATCH",
      headers: otroHeaders,
      params: { id: inv._id },
      body: { nombre: "Robado" },
    });
    expect(status).toBe(404);
  });

  it("exige autenticacion", async () => {
    const { status } = await callRoute(GET, {});
    expect(status).toBe(401);
  });
});
