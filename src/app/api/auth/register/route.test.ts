import { describe, it, expect } from "vitest";
import { POST } from "./route";
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
