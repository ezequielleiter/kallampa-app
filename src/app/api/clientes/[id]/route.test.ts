import { describe, it, expect, beforeEach } from "vitest";
import { PATCH } from "./route";
import {
  callRoute,
  makeUser,
  authHeaders,
  makeCliente,
  makeLoteConCosecha,
  makeVenta,
} from "@/test-utils/api-test-helpers";

const NONEXISTENT_ID = "507f1f77bcf86cd799439011";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

describe("PATCH /api/clientes/[id]", () => {
  it("edita, borra contacto con null y desactiva; devuelve agregados", async () => {
    const cliente = await makeCliente({ userId: user._id, headers, nombre: "Ana", contacto: "ana@x.com" });
    const { batch } = await makeLoteConCosecha({ userId: user._id, headers });
    await makeVenta({ userId: user._id, headers, clienteId: cliente._id, items: [{ batchId: batch._id, kg: 1, precioPorKg: 500 }] });

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: cliente._id },
      body: { nombre: "Ana María", contacto: null, activo: false },
    });
    expect(status).toBe(200);
    expect(json.data).toMatchObject({
      nombre: "Ana María",
      activo: false,
      totalComprado: 500,
      cantidadVentas: 1,
      saldoPendiente: 500,
    });
    expect(json.data.contacto).toBeUndefined();
  });

  it("409 si el nombre nuevo ya esta en uso", async () => {
    await makeCliente({ userId: user._id, headers, nombre: "Ana" });
    const b = await makeCliente({ userId: user._id, headers, nombre: "Beto" });
    const { status, json } = await callRoute(PATCH, { method: "PATCH", headers, params: { id: b._id }, body: { nombre: "Ana" } });
    expect(status).toBe(409);
    expect(json.code).toBe("cliente_nombre_en_uso");
  });

  it("404 cliente_no_encontrado si no existe o es de otro usuario", async () => {
    const cliente = await makeCliente({ userId: user._id, headers });
    const otro = await makeUser();
    const r = await callRoute(PATCH, { method: "PATCH", headers: authHeaders(otro), params: { id: cliente._id }, body: { activo: false } });
    expect(r.status).toBe(404);
    expect(r.json.code).toBe("cliente_no_encontrado");
    const r2 = await callRoute(PATCH, { method: "PATCH", headers, params: { id: NONEXISTENT_ID }, body: { activo: false } });
    expect(r2.status).toBe(404);
  });
});
