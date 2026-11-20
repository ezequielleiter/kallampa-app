import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "./api-client";

describe("apiFetch: fallas de red", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sin conexion: mensaje accionable en vez del TypeError del navegador", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(apiFetch("/api/x")).rejects.toThrow(/No se pudo conectar con el servidor/);
  });

  it("respuesta que no es JSON: mensaje accionable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<html>502</html>", { status: 502 }))
    );
    await expect(apiFetch("/api/x")).rejects.toThrow(/no respondió como se esperaba/);
  });

  it("error de la API: usa el mensaje del backend", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ error: "Nombre requerido", code: "nombre_requerido" }, { status: 400 })
      )
    );
    await expect(apiFetch("/api/x")).rejects.toThrow("Nombre requerido");
  });
});
