import { describe, it, expect } from "vitest";
import { GET, PATCH, DELETE } from "./route";
import { POST as createNota } from "../route";
import { callRoute } from "@/test-utils/api-test-helpers";

const NONEXISTENT_ID = "507f1f77bcf86cd799439011";

async function makeNota(overrides: Record<string, unknown> = {}) {
  const { json } = await callRoute(createNota, {
    method: "POST",
    body: { titulo: "Nota de prueba", contenido: "contenido", ...overrides },
  });
  return json.data as { _id: string; titulo: string; contenido: string };
}

describe("GET /api/notas/[id]", () => {
  it("devuelve la nota completa", async () => {
    const nota = await makeNota({ titulo: "Detalle", contenido: "## Título\n\ncuerpo" });

    const { status, json } = await callRoute(GET, { params: { id: nota._id } });
    expect(status).toBe(200);
    expect(json.data.titulo).toBe("Detalle");
    expect(json.data.contenido).toBe("## Título\n\ncuerpo");
  });

  it("404 en un id inexistente", async () => {
    const { status, json } = await callRoute(GET, { params: { id: NONEXISTENT_ID } });
    expect(status).toBe(404);
    expect(json.error).toMatch(/no encontrada/i);
  });
});

describe("PATCH /api/notas/[id]", () => {
  it("edita el titulo y/o el contenido parcialmente", async () => {
    const nota = await makeNota({ titulo: "Original", contenido: "v1" });

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: nota._id },
      body: { contenido: "v2" },
    });

    expect(status).toBe(200);
    expect(json.data.titulo).toBe("Original");
    expect(json.data.contenido).toBe("v2");
  });

  it("404 en un id inexistente", async () => {
    const { status } = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: NONEXISTENT_ID },
      body: { titulo: "x" },
    });
    expect(status).toBe(404);
  });
});

describe("DELETE /api/notas/[id]", () => {
  it("borra la nota (fisico)", async () => {
    const nota = await makeNota();

    const { status } = await callRoute(DELETE, { params: { id: nota._id } });
    expect(status).toBe(200);

    const { status: status404 } = await callRoute(GET, { params: { id: nota._id } });
    expect(status404).toBe(404);
  });

  it("404 en un id inexistente", async () => {
    const { status } = await callRoute(DELETE, { params: { id: NONEXISTENT_ID } });
    expect(status).toBe(404);
  });
});
