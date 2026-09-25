import { describe, it, expect, afterEach, vi } from "vitest";
import { GET, POST } from "./route";
import { callRoute } from "@/test-utils/api-test-helpers";

function registerBody(overrides: Record<string, unknown> = {}) {
  return {
    username: `user${Math.random().toString(36).slice(2, 8)}`,
    email: `user${Math.random().toString(36).slice(2, 8)}@test.com`,
    password: "password123",
    ...overrides,
  };
}

describe("POST /api/auth/register", () => {
  it("crea un usuario y devuelve token + apiKey + user sin passwordHash", async () => {
    const body = registerBody();
    const { status, json } = await callRoute(POST, { method: "POST", body });

    expect(status).toBe(201);
    expect(json.data.token).toEqual(expect.any(String));
    expect(json.data.apiKey).toEqual(expect.any(String));
    expect(json.data.user.username).toBe(body.username.toLowerCase());
    expect(json.data.user.email).toBe(body.email.toLowerCase());
    expect(json.data.user.passwordHash).toBeUndefined();
    expect(json.data.passwordHash).toBeUndefined();
  });

  it("rechaza username duplicado", async () => {
    const body = registerBody();
    await callRoute(POST, { method: "POST", body });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: registerBody({ username: body.username, email: `otro${Date.now()}@test.com` }),
    });

    expect(status).toBe(409);
    expect(json.error).toEqual(expect.any(String));
  });

  it("rechaza email duplicado", async () => {
    const body = registerBody();
    await callRoute(POST, { method: "POST", body });

    const { status } = await callRoute(POST, {
      method: "POST",
      body: registerBody({ email: body.email, username: `otro${Date.now()}` }),
    });

    expect(status).toBe(409);
  });

  it("rechaza password corta", async () => {
    const { status } = await callRoute(POST, {
      method: "POST",
      body: registerBody({ password: "corta" }),
    });
    expect(status).toBe(400);
  });

  it("rechaza username corto", async () => {
    const { status } = await callRoute(POST, {
      method: "POST",
      body: registerBody({ username: "ab" }),
    });
    expect(status).toBe(400);
  });

  it("rechaza email invalido", async () => {
    const { status } = await callRoute(POST, {
      method: "POST",
      body: registerBody({ email: "no-es-un-email" }),
    });
    expect(status).toBe(400);
  });
});

describe("registro controlado por REGISTRO_HABILITADO", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("cerrado explicitamente → 403 registro_cerrado y no crea el usuario", async () => {
    vi.stubEnv("REGISTRO_HABILITADO", "false");
    const { status, json } = await callRoute(POST, { method: "POST", body: registerBody() });
    expect(status).toBe(403);
    expect(json.code).toBe("registro_cerrado");
  });

  it("en produccion sin la variable queda cerrado; con 'true' se abre", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("REGISTRO_HABILITADO", "");
    expect((await callRoute(POST, { method: "POST", body: registerBody() })).status).toBe(403);
    expect((await callRoute(GET, {})).json.data).toEqual({ habilitado: false });

    vi.stubEnv("REGISTRO_HABILITADO", "true");
    expect((await callRoute(POST, { method: "POST", body: registerBody() })).status).toBe(201);
    expect((await callRoute(GET, {})).json.data).toEqual({ habilitado: true });
  });

  it("fuera de produccion sin la variable queda abierto", async () => {
    vi.stubEnv("REGISTRO_HABILITADO", "");
    expect((await callRoute(GET, {})).json.data).toEqual({ habilitado: true });
  });
});
