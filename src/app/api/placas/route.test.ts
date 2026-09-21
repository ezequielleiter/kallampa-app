import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "./route";
import { callRoute, makeClonacion, colonizarPlacas, makeUser, authHeaders } from "@/test-utils/api-test-helpers";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

describe("GET /api/placas", () => {
  it("?clonacionId= lista solo las placas de esa clonacion", async () => {
    const c1 = await makeClonacion({ userId: user._id, headers, cantidadPlacas: 2 });
    const c2 = await makeClonacion({ userId: user._id, headers, cantidadPlacas: 1 });

    const { status, json } = await callRoute(GET, { headers, searchParams: { clonacionId: c1._id } });
    expect(status).toBe(200);
    expect(json.data).toHaveLength(2);

    const { json: json2 } = await callRoute(GET, { headers, searchParams: { clonacionId: c2._id } });
    expect(json2.data).toHaveLength(1);
  });

  it("?estado= acepta una lista separada por comas", async () => {
    const clonacion = await makeClonacion({ userId: user._id, headers, cantidadPlacas: 3 });
    await colonizarPlacas([clonacion.placas[0], clonacion.placas[1]], { userId: user._id, headers });

    const { PATCH } = await import("@/app/api/placas/[id]/route");
    await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: clonacion.placas[1]._id },
      body: { estado: "contaminado" },
    });

    const { json } = await callRoute(GET, {
      headers,
      searchParams: { clonacionId: clonacion._id, estado: "colonizado,contaminado" },
    });
    expect(json.data).toHaveLength(2);
  });

  it("sin filtros devuelve todas las placas", async () => {
    await makeClonacion({ userId: user._id, headers, cantidadPlacas: 2 });
    await makeClonacion({ userId: user._id, headers, cantidadPlacas: 3 });

    const { json } = await callRoute(GET, { headers });
    expect(json.data).toHaveLength(5);
  });
});
