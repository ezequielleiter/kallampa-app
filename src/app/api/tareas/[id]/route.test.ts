import { describe, it, expect } from "vitest";
import { GET, PATCH, DELETE } from "./route";
import { callRoute, makeTarea } from "@/test-utils/api-test-helpers";

const NONEXISTENT_ID = "507f1f77bcf86cd799439011";

describe("GET /api/tareas/[id]", () => {
  it("devuelve la tarea completa", async () => {
    const tarea = await makeTarea({ titulo: "Detalle", descripcion: "algo", fecha: "2026-04-01" });

    const { status, json } = await callRoute(GET, { params: { id: tarea._id } });
    expect(status).toBe(200);
    expect(json.data.titulo).toBe("Detalle");
    expect(json.data.descripcion).toBe("algo");
    expect(json.data.estado).toBe("pendiente");
  });

  it("404 en un id inexistente", async () => {
    const { status, json } = await callRoute(GET, { params: { id: NONEXISTENT_ID } });
    expect(status).toBe(404);
    expect(json.error).toMatch(/no encontrada/i);
  });
});

describe("PATCH /api/tareas/[id]", () => {
  it("edita parcialmente (solo el estado, sin tocar el titulo)", async () => {
    const tarea = await makeTarea({ titulo: "Original" });

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: tarea._id },
      body: { estado: "hecha" },
    });

    expect(status).toBe(200);
    expect(json.data.titulo).toBe("Original");
    expect(json.data.estado).toBe("hecha");
  });

  it("404 en un id inexistente", async () => {
    const { status } = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: NONEXISTENT_ID },
      body: { estado: "hecha" },
    });
    expect(status).toBe(404);
  });
});

describe("DELETE /api/tareas/[id]", () => {
  it("borra la tarea (fisico)", async () => {
    const tarea = await makeTarea();

    const { status } = await callRoute(DELETE, { params: { id: tarea._id } });
    expect(status).toBe(200);

    const { status: status404 } = await callRoute(GET, { params: { id: tarea._id } });
    expect(status404).toBe(404);
  });

  it("404 en un id inexistente o doble borrado", async () => {
    const tarea = await makeTarea();

    await callRoute(DELETE, { params: { id: tarea._id } });
    const { status } = await callRoute(DELETE, { params: { id: tarea._id } });
    expect(status).toBe(404);

    const { status: status2 } = await callRoute(DELETE, { params: { id: NONEXISTENT_ID } });
    expect(status2).toBe(404);
  });
});
