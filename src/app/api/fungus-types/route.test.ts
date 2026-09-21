import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { callRoute, makeUser, authHeaders } from "@/test-utils/api-test-helpers";

const DIAS = {
  inoculacionGrano: 14,
  incubacion: 20,
  fructificacion: 10,
};

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

describe("POST /api/fungus-types", () => {
  it("crea un tipo de hongo", async () => {
    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
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
      headers,
      body: { nombre: "Girgola", diasEsperadosDefault: DIAS },
    });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { nombre: "Girgola", diasEsperadosDefault: DIAS },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/ya existe/i);
  });

  it("crea con iniciales en minuscula y las guarda en mayuscula", async () => {
    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { nombre: "Ostra", iniciales: "ost", diasEsperadosDefault: DIAS },
    });

    expect(status).toBe(201);
    expect(json.data.iniciales).toBe("OST");
  });

  it("rechaza iniciales invalidas (mas de 4 letras) con 400", async () => {
    const { status } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { nombre: "Ostra", iniciales: "ABCDE", diasEsperadosDefault: DIAS },
    });

    expect(status).toBe(400);
  });

  it("rechaza iniciales invalidas (con un digito) con 400", async () => {
    const { status } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { nombre: "Ostra", iniciales: "O5T", diasEsperadosDefault: DIAS },
    });

    expect(status).toBe(400);
  });

  it("rechaza iniciales duplicadas entre hongos activos con 409", async () => {
    await callRoute(POST, {
      method: "POST",
      headers,
      body: { nombre: "Ostra", iniciales: "OST", diasEsperadosDefault: DIAS },
    });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { nombre: "Ostra Rosa", iniciales: "OST", diasEsperadosDefault: DIAS },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/iniciales/i);
  });

  it("permite iniciales que coinciden con las de un hongo desactivado", async () => {
    const { json: creado } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { nombre: "Ostra", iniciales: "OST", diasEsperadosDefault: DIAS },
    });

    const { PATCH } = await import("./[id]/route");
    await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: creado.data._id },
      body: { activo: false },
    });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { nombre: "Ostra Rosa", iniciales: "OST", diasEsperadosDefault: DIAS },
    });

    expect(status).toBe(201);
    expect(json.data.iniciales).toBe("OST");
  });
});

describe("GET /api/fungus-types", () => {
  it("lista los tipos de hongo creados", async () => {
    await callRoute(POST, { method: "POST", headers, body: { nombre: "Girgola", diasEsperadosDefault: DIAS } });
    await callRoute(POST, { method: "POST", headers, body: { nombre: "Reishi", diasEsperadosDefault: DIAS } });

    const { status, json } = await callRoute(GET, { headers });
    expect(status).toBe(200);
    expect(json.data).toHaveLength(2);
  });
});
