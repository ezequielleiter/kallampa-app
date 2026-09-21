import { describe, it, expect } from "vitest";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "./route";
import { callRoute } from "@/test-utils/api-test-helpers";

const INVALID_CREDENTIALS_MESSAGE = "Usuario/email o contraseña incorrectos";

async function registerUser(overrides: Record<string, unknown> = {}) {
  const body = {
    username: `user${Math.random().toString(36).slice(2, 8)}`,
    email: `user${Math.random().toString(36).slice(2, 8)}@test.com`,
    password: "password123",
    ...overrides,
  };
  await callRoute(register, { method: "POST", body });
  return body;
}

describe("POST /api/auth/login", () => {
  it("loguea con username", async () => {
    const user = await registerUser();
    const { status, json } = await callRoute(login, {
      method: "POST",
      body: { identificador: user.username, password: user.password },
    });
    expect(status).toBe(200);
    expect(json.data.token).toEqual(expect.any(String));
    expect(json.data.apiKey).toEqual(expect.any(String));
    expect(json.data.user.username).toBe(user.username.toLowerCase());
  });

  it("loguea con email", async () => {
    const user = await registerUser();
    const { status, json } = await callRoute(login, {
      method: "POST",
      body: { identificador: user.email, password: user.password },
    });
    expect(status).toBe(200);
    expect(json.data.user.email).toBe(user.email.toLowerCase());
  });

  it("rechaza contraseña incorrecta con mensaje generico", async () => {
    const user = await registerUser();
    const { status, json } = await callRoute(login, {
      method: "POST",
      body: { identificador: user.username, password: "otraCosa123" },
    });
    expect(status).toBe(401);
    expect(json.error).toBe(INVALID_CREDENTIALS_MESSAGE);
    expect(json.code).toBe("credenciales_invalidas");
  });

  it("rechaza usuario inexistente con el mismo mensaje generico", async () => {
    const { status, json } = await callRoute(login, {
      method: "POST",
      body: { identificador: "no-existe-nadie", password: "loquesea123" },
    });
    expect(status).toBe(401);
    expect(json.error).toBe(INVALID_CREDENTIALS_MESSAGE);
    expect(json.code).toBe("credenciales_invalidas");
  });
});
