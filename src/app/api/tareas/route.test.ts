import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { callRoute, makeUser, authHeaders } from "@/test-utils/api-test-helpers";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

describe("POST /api/tareas", () => {
  it("crea la tarea con estado 'pendiente' por default", async () => {
    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { titulo: "Revisar incubadora", fecha: "2026-03-15" },
    });

    expect(status).toBe(201);
    expect(json.data.titulo).toBe("Revisar incubadora");
    expect(json.data.estado).toBe("pendiente");
  });

  it("rechaza con 400 (Zod) si falta el titulo", async () => {
    const { status } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { fecha: "2026-03-15" },
    });

    expect(status).toBe(400);
  });

  it("rechaza con 400 (Zod) si falta la fecha", async () => {
    const { status } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { titulo: "Sin fecha" },
    });

    expect(status).toBe(400);
  });

  it("rechaza con 400 (Zod) si la fecha es invalida", async () => {
    const { status } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { titulo: "Fecha rara", fecha: "no-es-una-fecha" },
    });

    expect(status).toBe(400);
  });
});

describe("GET /api/tareas", () => {
  it("lista todas las tareas ordenadas por fecha, sin filtro", async () => {
    await callRoute(POST, { method: "POST", headers, body: { titulo: "B", fecha: "2026-05-20" } });
    await callRoute(POST, { method: "POST", headers, body: { titulo: "A", fecha: "2026-05-10" } });

    const { status, json } = await callRoute(GET, { headers });
    expect(status).toBe(200);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].titulo).toBe("A");
    expect(json.data[1].titulo).toBe("B");
  });

  it("filtra por ?year=&month=, incluyendo el primer y ultimo dia del mes", async () => {
    await callRoute(POST, {
      method: "POST",
      headers,
      body: { titulo: "Primer dia", fecha: new Date(Date.UTC(2026, 5, 1)).toISOString() },
    });
    await callRoute(POST, {
      method: "POST",
      headers,
      body: { titulo: "Ultimo dia", fecha: new Date(Date.UTC(2026, 5, 30)).toISOString() },
    });
    await callRoute(POST, {
      method: "POST",
      headers,
      body: { titulo: "Mes siguiente", fecha: new Date(Date.UTC(2026, 6, 1)).toISOString() },
    });

    const { status, json } = await callRoute(GET, {
      headers,
      searchParams: { year: "2026", month: "6" },
    });

    expect(status).toBe(200);
    expect(json.data).toHaveLength(2);
    const titulos = json.data.map((t: { titulo: string }) => t.titulo);
    expect(titulos).toEqual(["Primer dia", "Ultimo dia"]);
  });

  it("no incluye tareas creadas por otro usuario (y viceversa)", async () => {
    await callRoute(POST, { method: "POST", headers, body: { titulo: "De A", fecha: "2026-05-20" } });

    const otroUsuario = await makeUser();
    const otrosHeaders = authHeaders(otroUsuario);
    await callRoute(POST, { method: "POST", headers: otrosHeaders, body: { titulo: "De B", fecha: "2026-05-21" } });

    const { json: jsonA } = await callRoute(GET, { headers });
    expect(jsonA.data).toHaveLength(1);
    expect(jsonA.data[0].titulo).toBe("De A");

    const { json: jsonB } = await callRoute(GET, { headers: otrosHeaders });
    expect(jsonB.data).toHaveLength(1);
    expect(jsonB.data[0].titulo).toBe("De B");
  });
});
