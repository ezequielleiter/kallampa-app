import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST } from "./route";
import {
  callRoute,
  makeUser,
  authHeaders,
  makeCliente,
  makeLoteConCosecha,
  makeVenta,
} from "@/test-utils/api-test-helpers";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

describe("POST /api/clientes", () => {
  it("crea el cliente con agregados en 0", async () => {
    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { nombre: "  Restaurante Sol ", contacto: "11 5555-5555", notas: "" },
    });
    expect(status).toBe(201);
    expect(json.data).toMatchObject({
      nombre: "Restaurante Sol",
      contacto: "11 5555-5555",
      activo: true,
      totalComprado: 0,
      cantidadVentas: 0,
      saldoPendiente: 0,
    });
    expect(json.data.notas).toBeUndefined();
  });

  it("409 cliente_nombre_en_uso con nombre repetido (el mismo nombre en otra cuenta si se puede)", async () => {
    await makeCliente({ userId: user._id, headers, nombre: "Ana" });
    const { status, json } = await callRoute(POST, { method: "POST", headers, body: { nombre: "Ana" } });
    expect(status).toBe(409);
    expect(json.code).toBe("cliente_nombre_en_uso");

    const otro = await makeUser();
    const r = await callRoute(POST, { method: "POST", headers: authHeaders(otro), body: { nombre: "Ana" } });
    expect(r.status).toBe(201);
  });

  it("400 sin nombre", async () => {
    const { status, json } = await callRoute(POST, { method: "POST", headers, body: { nombre: "  " } });
    expect(status).toBe(400);
    expect(json.codes).toContain("nombre_requerido");
  });
});

describe("GET /api/clientes", () => {
  it("lista por nombre con totalComprado, cantidadVentas y saldoPendiente; ?activos=1 filtra", async () => {
    const zeta = await makeCliente({ userId: user._id, headers, nombre: "Zeta" });
    const alfa = await makeCliente({ userId: user._id, headers, nombre: "Alfa" });
    const inactivo = await makeCliente({ userId: user._id, headers, nombre: "Medio" });
    const { PATCH } = await import("./[id]/route");
    await callRoute(PATCH, { method: "PATCH", headers, params: { id: inactivo._id }, body: { activo: false } });

    const { batch } = await makeLoteConCosecha({ userId: user._id, headers, cosechadoKg: 10 });
    await makeVenta({ userId: user._id, headers, clienteId: alfa._id, cobrada: true, items: [{ batchId: batch._id, kg: 2, precioPorKg: 1000 }] });
    await makeVenta({ userId: user._id, headers, clienteId: alfa._id, items: [{ batchId: batch._id, kg: 1.5, precioPorKg: 1000 }] });
    // Venta sin cliente: no suma a nadie.
    await makeVenta({ userId: user._id, headers, items: [{ batchId: batch._id, kg: 1, precioPorKg: 1000 }] });

    const { status, json } = await callRoute(GET, { headers });
    expect(status).toBe(200);
    expect(json.data.map((c: { nombre: string }) => c.nombre)).toEqual(["Alfa", "Medio", "Zeta"]);
    expect(json.data[0]).toMatchObject({ _id: alfa._id, totalComprado: 3500, cantidadVentas: 2, saldoPendiente: 1500 });
    expect(json.data[2]).toMatchObject({ _id: zeta._id, totalComprado: 0, cantidadVentas: 0, saldoPendiente: 0 });

    const activos = await callRoute(GET, { headers, searchParams: { activos: "1" } });
    expect(activos.json.data.map((c: { nombre: string }) => c.nombre)).toEqual(["Alfa", "Zeta"]);

    const otro = await makeUser();
    const ajeno = await callRoute(GET, { headers: authHeaders(otro) });
    expect(ajeno.json.data).toEqual([]);
  });
});
