import { describe, it, expect, beforeEach } from "vitest";
import { GET, PATCH, DELETE } from "./route";
import { POST } from "../route";
import {
  callRoute,
  makeUser,
  authHeaders,
  makeLoteConCosecha,
  makeCliente,
  makeVenta,
} from "@/test-utils/api-test-helpers";

const NONEXISTENT_ID = "507f1f77bcf86cd799439011";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

function body(items: { batchId: string; kg: number; precioPorKg: number }[], extra: Record<string, unknown> = {}) {
  return { fecha: "2026-05-01", items, medioPago: "efectivo", cobrada: false, ...extra };
}

describe("GET /api/ventas/[id]", () => {
  it("devuelve la venta populada; 404 si no existe o es de otro usuario", async () => {
    const { batch } = await makeLoteConCosecha({ userId: user._id, headers });
    const venta = await makeVenta({ userId: user._id, headers, items: [{ batchId: batch._id, kg: 1, precioPorKg: 10 }] });

    const r = await callRoute(GET, { headers, params: { id: venta._id } });
    expect(r.status).toBe(200);
    expect(r.json.data.total).toBe(10);
    expect(r.json.data.items[0].batchId.numeroLote).toBe(batch.numeroLote);

    expect((await callRoute(GET, { headers, params: { id: NONEXISTENT_ID } })).status).toBe(404);
    const otro = await makeUser();
    const r2 = await callRoute(GET, { headers: authHeaders(otro), params: { id: venta._id } });
    expect(r2.status).toBe(404);
    expect(r2.json.code).toBe("venta_no_encontrada");
  });
});

describe("PATCH /api/ventas/[id]", () => {
  it("{cobrada} solo marca cobrada (setea fechaCobro) y pendiente (la borra)", async () => {
    const { batch } = await makeLoteConCosecha({ userId: user._id, headers });
    const venta = await makeVenta({ userId: user._id, headers, items: [{ batchId: batch._id, kg: 1, precioPorKg: 10 }] });

    const cobrar = await callRoute(PATCH, { method: "PATCH", headers, params: { id: venta._id }, body: { cobrada: true } });
    expect(cobrar.status).toBe(200);
    expect(cobrar.json.data.cobrada).toBe(true);
    expect(cobrar.json.data.fechaCobro).toBeDefined();
    expect(cobrar.json.data.numeroVenta).toBe(venta.numeroVenta);
    expect(cobrar.json.data.items).toHaveLength(1);

    const pendiente = await callRoute(PATCH, { method: "PATCH", headers, params: { id: venta._id }, body: { cobrada: false } });
    expect(pendiente.json.data.cobrada).toBe(false);
    expect(pendiente.json.data.fechaCobro).toBeUndefined();
  });

  it("edita la venta completa; el stock excluye a la propia venta", async () => {
    const { batch } = await makeLoteConCosecha({ userId: user._id, headers, cosechadoKg: 3 });
    const cliente = await makeCliente({ userId: user._id, headers });
    const venta = await makeVenta({
      userId: user._id,
      headers,
      clienteId: cliente._id,
      items: [{ batchId: batch._id, kg: 2, precioPorKg: 8000 }],
    });

    // 3 kg cosechados, esta venta tiene 2: puede pasar a 3 (su propio kg + 1 libre).
    const ok3 = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: venta._id },
      body: body([{ batchId: batch._id, kg: 3, precioPorKg: 9000 }], { clienteId: null, notas: "editada", cobrada: true }),
    });
    expect(ok3.status).toBe(200);
    expect(ok3.json.data.numeroVenta).toBe(venta.numeroVenta);
    expect(ok3.json.data.total).toBe(27000);
    expect(ok3.json.data.clienteId).toBeNull();
    expect(ok3.json.data.notas).toBe("editada");
    expect(ok3.json.data.fechaCobro).toBeDefined();

    // Pero no a 3.5.
    const mucho = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: venta._id },
      body: body([{ batchId: batch._id, kg: 3.5, precioPorKg: 9000 }]),
    });
    expect(mucho.status).toBe(409);
    expect(mucho.json.code).toBe("stock_insuficiente");
    expect(mucho.json.error).toBe(`El lote ${batch.numeroLote} tiene 3 kg disponibles`);
  });

  it("409 si al editar otra venta ya consumio el stock", async () => {
    const { batch } = await makeLoteConCosecha({ userId: user._id, headers, cosechadoKg: 3 });
    const v1 = await makeVenta({ userId: user._id, headers, items: [{ batchId: batch._id, kg: 1, precioPorKg: 1 }] });
    await makeVenta({ userId: user._id, headers, items: [{ batchId: batch._id, kg: 1.5, precioPorKg: 1 }] });

    const r = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: v1._id },
      body: body([{ batchId: batch._id, kg: 2, precioPorKg: 1 }]),
    });
    expect(r.status).toBe(409);
    expect(r.json.error).toContain("1,5 kg disponibles");
  });

  it("404 con lote/cliente ajeno o venta inexistente", async () => {
    const { batch } = await makeLoteConCosecha({ userId: user._id, headers });
    const venta = await makeVenta({ userId: user._id, headers, items: [{ batchId: batch._id, kg: 1, precioPorKg: 1 }] });
    const otro = await makeUser();
    const otroHeaders = authHeaders(otro);
    const clienteAjeno = await makeCliente({ userId: otro._id, headers: otroHeaders });

    const r = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: venta._id },
      body: body([{ batchId: batch._id, kg: 1, precioPorKg: 1 }], { clienteId: clienteAjeno._id }),
    });
    expect(r.status).toBe(404);
    expect(r.json.code).toBe("cliente_no_encontrado");

    const r2 = await callRoute(PATCH, { method: "PATCH", headers, params: { id: NONEXISTENT_ID }, body: { cobrada: true } });
    expect(r2.status).toBe(404);
  });
});

describe("DELETE /api/ventas/[id]", () => {
  it("borra la venta y libera el stock", async () => {
    const { batch } = await makeLoteConCosecha({ userId: user._id, headers, cosechadoKg: 2 });
    const venta = await makeVenta({ userId: user._id, headers, items: [{ batchId: batch._id, kg: 2, precioPorKg: 1 }] });

    const bloqueada = await callRoute(POST, {
      method: "POST",
      headers,
      body: body([{ batchId: batch._id, kg: 1, precioPorKg: 1 }]),
    });
    expect(bloqueada.status).toBe(409);

    const del = await callRoute(DELETE, { method: "DELETE", headers, params: { id: venta._id } });
    expect(del.status).toBe(200);
    expect(del.json.data).toBeNull();
    expect((await callRoute(GET, { headers, params: { id: venta._id } })).status).toBe(404);

    const ahora = await callRoute(POST, {
      method: "POST",
      headers,
      body: body([{ batchId: batch._id, kg: 2, precioPorKg: 1 }]),
    });
    expect(ahora.status).toBe(201);
  });

  it("404 si es de otro usuario", async () => {
    const { batch } = await makeLoteConCosecha({ userId: user._id, headers });
    const venta = await makeVenta({ userId: user._id, headers, items: [{ batchId: batch._id, kg: 1, precioPorKg: 1 }] });
    const otro = await makeUser();
    const r = await callRoute(DELETE, { method: "DELETE", headers: authHeaders(otro), params: { id: venta._id } });
    expect(r.status).toBe(404);
  });
});
