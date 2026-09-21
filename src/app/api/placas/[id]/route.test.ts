import { describe, it, expect, beforeEach } from "vitest";
import { PATCH } from "./route";
import { callRoute, makeClonacion, makeUser, authHeaders } from "@/test-utils/api-test-helpers";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

describe("PATCH /api/placas/[id]", () => {
  it("cambia el estado de una placa", async () => {
    const clonacion = await makeClonacion({ userId: user._id, headers, cantidadPlacas: 1 });
    const placaId = clonacion.placas[0]._id;

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: placaId },
      body: { estado: "colonizado" },
    });

    expect(status).toBe(200);
    expect(json.data.estado).toBe("colonizado");
  });

  it("404 en una placa inexistente", async () => {
    const { status } = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: "507f1f77bcf86cd799439011" },
      body: { estado: "contaminado" },
    });

    expect(status).toBe(404);
  });
});
