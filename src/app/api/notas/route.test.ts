import { describe, it, expect } from "vitest";
import { GET, POST } from "./route";
import { callRoute } from "@/test-utils/api-test-helpers";

describe("POST /api/notas", () => {
  it("crea la nota con titulo y contenido", async () => {
    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: { titulo: "Mi primera nota", contenido: "## Hola\n\nTexto." },
    });

    expect(status).toBe(201);
    expect(json.data.titulo).toBe("Mi primera nota");
    expect(json.data.contenido).toBe("## Hola\n\nTexto.");
  });

  it("rechaza con 400 (Zod) si el titulo esta vacio", async () => {
    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: { titulo: "   ", contenido: "algo" },
    });

    expect(status).toBe(400);
    expect(json.error).toMatch(/título/i);
  });

  it("rechaza con 400 (Zod) si falta el titulo por completo", async () => {
    const { status } = await callRoute(POST, {
      method: "POST",
      body: { contenido: "algo" },
    });

    expect(status).toBe(400);
  });

  it("permite contenido vacio (nota recien empezada)", async () => {
    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: { titulo: "Borrador", contenido: "" },
    });

    expect(status).toBe(201);
    expect(json.data.contenido).toBe("");
  });
});

describe("GET /api/notas", () => {
  it("lista las notas ordenadas por ultima edicion, con un extracto en texto plano", async () => {
    await callRoute(POST, {
      method: "POST",
      body: { titulo: "Primera", contenido: "## Encabezado\n\nAlgo de **texto** en negrita." },
    });
    await callRoute(POST, {
      method: "POST",
      body: { titulo: "Segunda", contenido: "contenido simple" },
    });

    const { status, json } = await callRoute(GET);
    expect(status).toBe(200);
    expect(json.data).toHaveLength(2);
    // La mas reciente (Segunda) va primero.
    expect(json.data[0].titulo).toBe("Segunda");
    expect(json.data[1].titulo).toBe("Primera");
    // El extracto no tiene sintaxis Markdown cruda.
    expect(json.data[1].extracto).not.toMatch(/[#*]/);
    expect(json.data[1].extracto).toMatch(/Encabezado/);
  });
});
