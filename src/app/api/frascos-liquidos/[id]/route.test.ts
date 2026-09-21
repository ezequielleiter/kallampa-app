import { describe, it, expect, beforeEach } from "vitest";
import { PATCH } from "./route";
import {
  callRoute,
  makeClonacion,
  colonizarPlacas,
  makeFrascoLiquido,
  makeUser,
  authHeaders,
} from "@/test-utils/api-test-helpers";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

describe("PATCH /api/frascos-liquidos/[id]", () => {
  it("cambia el estado de un frasco liquido", async () => {
    const clonacion = await makeClonacion({ userId: user._id, headers, cantidadPlacas: 1 });
    const [placaId] = await colonizarPlacas([clonacion.placas[0]], { userId: user._id, headers });
    const frasco = await makeFrascoLiquido({ userId: user._id, headers, origenPlacaId: placaId });

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: frasco._id },
      body: { estado: "contaminado" },
    });

    expect(status).toBe(200);
    expect(json.data.estado).toBe("contaminado");
  });

  it("404 en un frasco liquido inexistente", async () => {
    const { status } = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: "507f1f77bcf86cd799439011" },
      body: { estado: "contaminado" },
    });

    expect(status).toBe(404);
  });
});
