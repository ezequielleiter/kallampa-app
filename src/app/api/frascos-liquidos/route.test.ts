import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST } from "./route";
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

describe("POST /api/frascos-liquidos", () => {
  it("una placa colonizada se puede usar para crear varios frascos liquidos, con etiqueta correlativa por clonacion", async () => {
    const clonacion = await makeClonacion({ userId: user._id, headers, cantidadPlacas: 1 });
    const [placaId] = await colonizarPlacas([clonacion.placas[0]], { userId: user._id, headers });

    const f1 = await makeFrascoLiquido({ userId: user._id, headers, origenPlacaId: placaId });
    const f2 = await makeFrascoLiquido({ userId: user._id, headers, origenPlacaId: placaId });

    expect(f1.numeroGuia).toBe(`${clonacion.numeroLote}-L01`);
    expect(f2.numeroGuia).toBe(`${clonacion.numeroLote}-L02`);
    expect(f1.estado).toBe("colonizando");
    expect(String(f1.clonacionId)).toBe(clonacion._id);

    // La placa de origen no cambia de estado (se puede reusar).
    const { GET: getPlacas } = await import("@/app/api/placas/route");
    const { json: placasJson } = await callRoute(getPlacas, {
      headers,
      searchParams: { clonacionId: clonacion._id },
    });
    expect(placasJson.data[0].estado).toBe("colonizado");
  });

  it("rechaza con 409 crear un frasco liquido desde una placa contaminada", async () => {
    const clonacion = await makeClonacion({ userId: user._id, headers, cantidadPlacas: 1 });
    const placaId = clonacion.placas[0]._id;

    const { PATCH } = await import("@/app/api/placas/[id]/route");
    await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: placaId },
      body: { estado: "contaminado" },
    });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { origenPlacaId: placaId, fechaCreacion: new Date().toISOString() },
    });

    expect(status).toBe(409);
    expect(json.error).toMatch(/contaminada/i);
  });

  it("rechaza con 400 si la placa de origen no existe", async () => {
    const { status } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { origenPlacaId: "000000000000000000000000", fechaCreacion: new Date().toISOString() },
    });
    expect(status).toBe(400);
  });
});

describe("GET /api/frascos-liquidos", () => {
  it("sin clonacionId devuelve todos los frascos liquidos del sistema (selector cross-clonacion)", async () => {
    const c1 = await makeClonacion({ userId: user._id, headers, cantidadPlacas: 1 });
    const c2 = await makeClonacion({ userId: user._id, headers, cantidadPlacas: 1 });
    const [p1] = await colonizarPlacas([c1.placas[0]], { userId: user._id, headers });
    const [p2] = await colonizarPlacas([c2.placas[0]], { userId: user._id, headers });
    await makeFrascoLiquido({ userId: user._id, headers, origenPlacaId: p1 });
    await makeFrascoLiquido({ userId: user._id, headers, origenPlacaId: p2 });

    const { status, json } = await callRoute(GET, { headers });
    expect(status).toBe(200);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].origenPlacaId).toHaveProperty("numeroPlaca");
    expect(json.data[0].clonacionId).toHaveProperty("numeroLote");
  });

  it("?clonacionId= filtra por clonacion", async () => {
    const c1 = await makeClonacion({ userId: user._id, headers, cantidadPlacas: 1 });
    const c2 = await makeClonacion({ userId: user._id, headers, cantidadPlacas: 1 });
    const [p1] = await colonizarPlacas([c1.placas[0]], { userId: user._id, headers });
    const [p2] = await colonizarPlacas([c2.placas[0]], { userId: user._id, headers });
    await makeFrascoLiquido({ userId: user._id, headers, origenPlacaId: p1 });
    await makeFrascoLiquido({ userId: user._id, headers, origenPlacaId: p2 });

    const { json } = await callRoute(GET, { headers, searchParams: { clonacionId: c1._id } });
    expect(json.data).toHaveLength(1);
  });

  it("?estado= acepta una lista separada por comas", async () => {
    const clonacion = await makeClonacion({ userId: user._id, headers, cantidadPlacas: 1 });
    const [placaId] = await colonizarPlacas([clonacion.placas[0]], { userId: user._id, headers });
    const f1 = await makeFrascoLiquido({ userId: user._id, headers, origenPlacaId: placaId });
    await makeFrascoLiquido({ userId: user._id, headers, origenPlacaId: placaId });

    const { PATCH } = await import("@/app/api/frascos-liquidos/[id]/route");
    await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: f1._id },
      body: { estado: "contaminado" },
    });

    const { json } = await callRoute(GET, {
      headers,
      searchParams: { estado: "colonizando,contaminado" },
    });
    expect(json.data).toHaveLength(2);
  });
});
