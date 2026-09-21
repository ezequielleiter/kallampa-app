import { describe, it, expect } from "vitest";
import { GET, POST } from "./route";
import { callRoute } from "@/test-utils/api-test-helpers";

describe("POST /api/tareas", () => {
  it("crea la tarea con estado 'pendiente' por default", async () => {
    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: { titulo: "Revisar incubadora", fecha: "2026-03-15" },
    });

    expect(status).toBe(201);
    expect(json.data.titulo).toBe("Revisar incubadora");
    expect(json.data.estado).toBe("pendiente");
  });

  it("rechaza con 400 (Zod) si falta el titulo", async () => {
    const { status } = await callRoute(POST, {
      method: "POST",
      body: { fecha: "2026-03-15" },
    });

    expect(status).toBe(400);
  });

  it("rechaza con 400 (Zod) si falta la fecha", async () => {
    const { status } = await callRoute(POST, {
      method: "POST",
      body: { titulo: "Sin fecha" },
    });

    expect(status).toBe(400);
  });

  it("rechaza con 400 (Zod) si la fecha es invalida", async () => {
    const { status } = await callRoute(POST, {
      method: "POST",
      body: { titulo: "Fecha rara", fecha: "no-es-una-fecha" },
    });

    expect(status).toBe(400);
  });
});

describe("GET /api/tareas", () => {
  it("lista todas las tareas ordenadas por fecha, sin filtro", async () => {
    await callRoute(POST, { method: "POST", body: { titulo: "B", fecha: "2026-05-20" } });
    await callRoute(POST, { method: "POST", body: { titulo: "A", fecha: "2026-05-10" } });

    const { status, json } = await callRoute(GET);
    expect(status).toBe(200);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].titulo).toBe("A");
    expect(json.data[1].titulo).toBe("B");
  });

  it("filtra por ?year=&month=, incluyendo el primer y ultimo dia del mes", async () => {
    await callRoute(POST, {
      method: "POST",
      body: { titulo: "Primer dia", fecha: new Date(Date.UTC(2026, 5, 1)).toISOString() },
    });
    await callRoute(POST, {
      method: "POST",
      body: { titulo: "Ultimo dia", fecha: new Date(Date.UTC(2026, 5, 30)).toISOString() },
    });
    await callRoute(POST, {
      method: "POST",
      body: { titulo: "Mes siguiente", fecha: new Date(Date.UTC(2026, 6, 1)).toISOString() },
    });

    const { status, json } = await callRoute(GET, {
      searchParams: { year: "2026", month: "6" },
    });

    expect(status).toBe(200);
    expect(json.data).toHaveLength(2);
    const titulos = json.data.map((t: { titulo: string }) => t.titulo);
    expect(titulos).toEqual(["Primer dia", "Ultimo dia"]);
  });
});
