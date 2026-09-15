import { describe, it, expect } from "vitest";
import { GET } from "./route";
import { callRoute, makeClonacion, colonizarPlacas } from "@/test-utils/api-test-helpers";

describe("GET /api/placas", () => {
  it("?clonacionId= lista solo las placas de esa clonacion", async () => {
    const c1 = await makeClonacion({ cantidadPlacas: 2 });
    const c2 = await makeClonacion({ cantidadPlacas: 1 });

    const { status, json } = await callRoute(GET, { searchParams: { clonacionId: c1._id } });
    expect(status).toBe(200);
    expect(json.data).toHaveLength(2);

    const { json: json2 } = await callRoute(GET, { searchParams: { clonacionId: c2._id } });
    expect(json2.data).toHaveLength(1);
  });

  it("?estado= acepta una lista separada por comas", async () => {
    const clonacion = await makeClonacion({ cantidadPlacas: 3 });
    await colonizarPlacas([clonacion.placas[0], clonacion.placas[1]]);

    const { PATCH } = await import("@/app/api/placas/[id]/route");
    await callRoute(PATCH, {
      method: "PATCH",
      params: { id: clonacion.placas[1]._id },
      body: { estado: "contaminado" },
    });

    const { json } = await callRoute(GET, {
      searchParams: { clonacionId: clonacion._id, estado: "colonizado,contaminado" },
    });
    expect(json.data).toHaveLength(2);
  });

  it("sin filtros devuelve todas las placas", async () => {
    await makeClonacion({ cantidadPlacas: 2 });
    await makeClonacion({ cantidadPlacas: 3 });

    const { json } = await callRoute(GET);
    expect(json.data).toHaveLength(5);
  });
});
