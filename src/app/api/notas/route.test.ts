import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { callRoute, makeUser, authHeaders } from "@/test-utils/api-test-helpers";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

describe("POST /api/notas", () => {
  it("crea la nota con titulo y contenido", async () => {
    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { titulo: "Mi primera nota", contenido: "## Hola\n\nTexto." },
    });

    expect(status).toBe(201);
    expect(json.data.titulo).toBe("Mi primera nota");
    expect(json.data.contenido).toBe("## Hola\n\nTexto.");
  });

  it("rechaza con 400 (Zod) si el titulo esta vacio", async () => {
    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { titulo: "   ", contenido: "algo" },
    });

    expect(status).toBe(400);
    expect(json.error).toMatch(/título/i);
  });

  it("rechaza con 400 (Zod) si falta el titulo por completo", async () => {
    const { status } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { contenido: "algo" },
    });

    expect(status).toBe(400);
  });

  it("permite contenido vacio (nota recien empezada)", async () => {
    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
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
      headers,
      body: { titulo: "Primera", contenido: "## Encabezado\n\nAlgo de **texto** en negrita." },
    });
    await callRoute(POST, {
      method: "POST",
      headers,
      body: { titulo: "Segunda", contenido: "contenido simple" },
    });

    const { status, json } = await callRoute(GET, { headers });
    expect(status).toBe(200);
    expect(json.data).toHaveLength(2);
    // La mas reciente (Segunda) va primero.
    expect(json.data[0].titulo).toBe("Segunda");
    expect(json.data[1].titulo).toBe("Primera");
    // El extracto no tiene sintaxis Markdown cruda.
    expect(json.data[1].extracto).not.toMatch(/[#*]/);
    expect(json.data[1].extracto).toMatch(/Encabezado/);
  });

  it("no incluye notas creadas por otro usuario", async () => {
    await callRoute(POST, {
      method: "POST",
      headers,
      body: { titulo: "Mia", contenido: "solo mia" },
    });

    const otroUsuario = await makeUser();
    const otrosHeaders = authHeaders(otroUsuario);
    await callRoute(POST, {
      method: "POST",
      headers: otrosHeaders,
      body: { titulo: "Ajena", contenido: "de otro" },
    });

    const { json } = await callRoute(GET, { headers });
    expect(json.data).toHaveLength(1);
    expect(json.data[0].titulo).toBe("Mia");
  });
});
