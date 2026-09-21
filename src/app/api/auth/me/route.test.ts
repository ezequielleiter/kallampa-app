import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { POST as register } from "@/app/api/auth/register/route";
import { GET as me } from "./route";
import { callRoute } from "@/test-utils/api-test-helpers";

// Firma un token ya vencido con jsonwebtoken directo (TTL negativo), para
// no depender de un mock de reloj sobre signSessionToken.
function signExpiredToken(userId: string): string {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET as string, { expiresIn: "-1s" });
}

// Test propio y autocontenido: /me es la unica ruta de esta fase que exige
// requireAuth, asi que arma su propio NextRequest con headers en vez de
// tocar callRoute/api-test-helpers.ts (eso lo extiende el retrofit de la
// Fase B para las ~29 rutas existentes).
async function callMe(headers: Record<string, string>) {
  const req = new NextRequest("http://localhost/api/auth/me", { headers });
  const res = await me(req);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function registerUser() {
  const body = {
    username: `user${Math.random().toString(36).slice(2, 8)}`,
    email: `user${Math.random().toString(36).slice(2, 8)}@test.com`,
    password: "password123",
  };
  const { json } = await callRoute(register, { method: "POST", body });
  return json.data as { token: string; apiKey: string; user: { _id: string; username: string; email: string } };
}

describe("GET /api/auth/me", () => {
  it("devuelve el usuario actual con headers validos", async () => {
    const { token, apiKey, user } = await registerUser();
    const { status, json } = await callMe({
      "x-api-key": apiKey,
      authorization: `Bearer ${token}`,
    });
    expect(status).toBe(200);
    expect(json.data.username).toBe(user.username);
    expect(json.data.email).toBe(user.email);
  });

  it("rechaza sin headers", async () => {
    const { status } = await callMe({});
    expect(status).toBe(401);
  });

  it("rechaza con api-key invalida", async () => {
    const { token } = await registerUser();
    const { status } = await callMe({
      "x-api-key": "no-existe",
      authorization: `Bearer ${token}`,
    });
    expect(status).toBe(401);
  });

  it("rechaza con JWT vencido", async () => {
    const { apiKey, user } = await registerUser();
    const expiredToken = signExpiredToken(user._id);
    const { status } = await callMe({
      "x-api-key": apiKey,
      authorization: `Bearer ${expiredToken}`,
    });
    expect(status).toBe(401);
  });

  it("rechaza si api-key y sesion pertenecen a cuentas distintas", async () => {
    const userA = await registerUser();
    const userB = await registerUser();
    const { status } = await callMe({
      "x-api-key": userA.apiKey,
      authorization: `Bearer ${userB.token}`,
    });
    expect(status).toBe(401);
  });
});
