import { describe, it, expect } from "vitest";
import { GET, POST } from "./route";
import {
  callRoute,
  makeClonacion,
  colonizarPlacas,
  makeFrascoLiquido,
} from "@/test-utils/api-test-helpers";

describe("POST /api/frascos-liquidos", () => {
  it("una placa colonizada se puede usar para crear varios frascos liquidos, con etiqueta correlativa por clonacion", async () => {
    const clonacion = await makeClonacion({ cantidadPlacas: 1 });
    const [placaId] = await colonizarPlacas([clonacion.placas[0]]);

    const f1 = await makeFrascoLiquido({ origenPlacaId: placaId });
    const f2 = await makeFrascoLiquido({ origenPlacaId: placaId });

    expect(f1.numeroGuia).toBe(`${clonacion.numeroLote}-L01`);
    expect(f2.numeroGuia).toBe(`${clonacion.numeroLote}-L02`);
    expect(f1.estado).toBe("valido");
    expect(String(f1.clonacionId)).toBe(clonacion._id);

    // La placa de origen no cambia de estado (se puede reusar).
    const { GET: getPlacas } = await import("@/app/api/placas/route");
    const { json: placasJson } = await callRoute(getPlacas, {
      searchParams: { clonacionId: clonacion._id },
    });
    expect(placasJson.data[0].estado).toBe("colonizado");
  });

  it("rechaza con 409 crear un frasco liquido desde una placa contaminada", async () => {
    const clonacion = await makeClonacion({ cantidadPlacas: 1 });
    const placaId = clonacion.placas[0]._id;

    const { PATCH } = await import("@/app/api/placas/[id]/route");
    await callRoute(PATCH, {
      method: "PATCH",
      params: { id: placaId },
      body: { estado: "contaminado" },
    });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      body: { origenPlacaId: placaId, fechaCreacion: new Date().toISOString() },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/contaminada/i);
  });

  it("rechaza con 400 si la placa de origen no existe", async () => {
    const { status } = await callRoute(POST, {
      method: "POST",
      body: { origenPlacaId: "000000000000000000000000", fechaCreacion: new Date().toISOString() },
    });
    expect(status).toBe(400);
  });
});

describe("GET /api/frascos-liquidos", () => {
  it("sin clonacionId devuelve todos los frascos liquidos del sistema (selector cross-clonacion)", async () => {
    const c1 = await makeClonacion({ cantidadPlacas: 1 });
    const c2 = await makeClonacion({ cantidadPlacas: 1 });
    const [p1] = await colonizarPlacas([c1.placas[0]]);
    const [p2] = await colonizarPlacas([c2.placas[0]]);
    await makeFrascoLiquido({ origenPlacaId: p1 });
    await makeFrascoLiquido({ origenPlacaId: p2 });

    const { status, json } = await callRoute(GET);
    expect(status).toBe(200);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].origenPlacaId).toHaveProperty("numeroPlaca");
    expect(json.data[0].clonacionId).toHaveProperty("numeroLote");
  });

  it("?clonacionId= filtra por clonacion", async () => {
    const c1 = await makeClonacion({ cantidadPlacas: 1 });
    const c2 = await makeClonacion({ cantidadPlacas: 1 });
    const [p1] = await colonizarPlacas([c1.placas[0]]);
    const [p2] = await colonizarPlacas([c2.placas[0]]);
    await makeFrascoLiquido({ origenPlacaId: p1 });
    await makeFrascoLiquido({ origenPlacaId: p2 });

    const { json } = await callRoute(GET, { searchParams: { clonacionId: c1._id } });
    expect(json.data).toHaveLength(1);
  });

  it("?estado= acepta una lista separada por comas", async () => {
    const clonacion = await makeClonacion({ cantidadPlacas: 1 });
    const [placaId] = await colonizarPlacas([clonacion.placas[0]]);
    const f1 = await makeFrascoLiquido({ origenPlacaId: placaId });
    await makeFrascoLiquido({ origenPlacaId: placaId });

    const { PATCH } = await import("@/app/api/frascos-liquidos/[id]/route");
    await callRoute(PATCH, {
      method: "PATCH",
      params: { id: f1._id },
      body: { estado: "contaminado" },
    });

    const { json } = await callRoute(GET, {
      searchParams: { estado: "valido,contaminado" },
    });
    expect(json.data).toHaveLength(2);
  });
});
