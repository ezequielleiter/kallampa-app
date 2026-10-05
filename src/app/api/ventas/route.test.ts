import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST } from "./route";
import {
  callRoute,
  makeUser,
  authHeaders,
  makeLoteConCosecha,
  makeCliente,
  makeVenta,
} from "@/test-utils/api-test-helpers";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

const hoy = () => new Date().toISOString().slice(0, 10);

describe("POST /api/ventas", () => {
  it("crea la venta con numero correlativo V-YYYY-NNN, total y relaciones populadas", async () => {
    const { batch } = await makeLoteConCosecha({ userId: user._id, headers, cosechadoKg: 3 });
    const cliente = await makeCliente({ userId: user._id, headers, nombre: "Verdulería Juan" });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      body: {
        fecha: "2026-03-10",
        clienteId: cliente._id,
        items: [{ batchId: batch._id, kg: 2, precioPorKg: 8000 }],
        medioPago: "transferencia",
        cobrada: false,
        notas: "  ",
      },
    });

    expect(status).toBe(201);
    expect(json.data.numeroVenta).toBe("V-2026-001");
    expect(json.data.total).toBe(16000);
    expect(json.data.clienteId).toMatchObject({ _id: cliente._id, nombre: "Verdulería Juan" });
    expect(json.data.items[0].batchId).toMatchObject({ _id: batch._id, numeroLote: batch.numeroLote });
    expect(json.data.fechaCobro).toBeUndefined();
    expect(json.data.notas).toBeUndefined();
    expect(json.data.fecha.slice(0, 10)).toBe("2026-03-10");

    const segunda = await makeVenta({
      userId: user._id,
      headers,
      fecha: "2026-04-01",
      items: [{ batchId: batch._id, kg: 0.5, precioPorKg: 8000 }],
    });
    expect(segunda.numeroVenta).toBe("V-2026-002");
    expect(segunda.clienteId).toBeNull();
  });

  it("cobrada true setea fechaCobro", async () => {
    const { batch } = await makeLoteConCosecha({ userId: user._id, headers });
    const venta = await makeVenta({
      userId: user._id,
      headers,
      cobrada: true,
      items: [{ batchId: batch._id, kg: 1, precioPorKg: 100 }],
    });
    expect(venta.cobrada).toBe(true);
    expect(venta.fechaCobro).toBeDefined();
  });

  it("409 stock_insuficiente si se pide mas de lo disponible", async () => {
    const { batch } = await makeLoteConCosecha({ userId: user._id, headers, cosechadoKg: 3 });
    await makeVenta({ userId: user._id, headers, items: [{ batchId: batch._id, kg: 2, precioPorKg: 8000 }] });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { fecha: hoy(), items: [{ batchId: batch._id, kg: 2, precioPorKg: 8000 }], medioPago: "efectivo", cobrada: false },
    });
    expect(status).toBe(409);
    expect(json.code).toBe("stock_insuficiente");
    expect(json.error).toBe(`El lote ${batch.numeroLote} tiene 1 kg disponibles`);
  });

  it("permite vender exactamente lo disponible (sin ruido de float)", async () => {
    const { batch } = await makeLoteConCosecha({ userId: user._id, headers, cosechadoKg: 0.3 });
    await makeVenta({ userId: user._id, headers, items: [{ batchId: batch._id, kg: 0.1, precioPorKg: 1 }] });
    const v = await makeVenta({ userId: user._id, headers, items: [{ batchId: batch._id, kg: 0.2, precioPorKg: 1 }] });
    expect(v.numeroVenta).toMatch(/^V-\d{4}-002$/);
  });

  it("reparte una venta entre 2 lotes", async () => {
    const { batch: a } = await makeLoteConCosecha({ userId: user._id, headers, cosechadoKg: 1 });
    const { batch: b } = await makeLoteConCosecha({ userId: user._id, headers, cosechadoKg: 2 });

    const venta = await makeVenta({
      userId: user._id,
      headers,
      items: [
        { batchId: a._id, kg: 1, precioPorKg: 8000 },
        { batchId: b._id, kg: 1.5, precioPorKg: 7000 },
      ],
    });
    expect(venta.items).toHaveLength(2);
    expect(venta.total).toBe(18500);

    // El lote A quedo en 0 -> no se le puede vender mas.
    const { status } = await callRoute(POST, {
      method: "POST",
      headers,
      body: { fecha: hoy(), items: [{ batchId: a._id, kg: 0.1, precioPorKg: 1 }], medioPago: "efectivo", cobrada: false },
    });
    expect(status).toBe(409);
  });

  it("400 si un lote se repite en la venta", async () => {
    const { batch } = await makeLoteConCosecha({ userId: user._id, headers });
    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      body: {
        fecha: hoy(),
        items: [
          { batchId: batch._id, kg: 1, precioPorKg: 1 },
          { batchId: batch._id, kg: 1, precioPorKg: 1 },
        ],
        medioPago: "efectivo",
        cobrada: false,
      },
    });
    expect(status).toBe(400);
    expect(json.codes).toContain("lote_repetido_en_venta");
  });

  it("400 sin items o con kg <= 0", async () => {
    const { batch } = await makeLoteConCosecha({ userId: user._id, headers });
    const sinItems = await callRoute(POST, {
      method: "POST",
      headers,
      body: { fecha: hoy(), items: [], medioPago: "efectivo", cobrada: false },
    });
    expect(sinItems.status).toBe(400);
    const kgCero = await callRoute(POST, {
      method: "POST",
      headers,
      body: { fecha: hoy(), items: [{ batchId: batch._id, kg: 0, precioPorKg: 1 }], medioPago: "efectivo", cobrada: false },
    });
    expect(kgCero.status).toBe(400);
  });

  it("404 con un lote o cliente de otro usuario", async () => {
    const otro = await makeUser();
    const otroHeaders = authHeaders(otro);
    const { batch: ajeno } = await makeLoteConCosecha({ userId: otro._id, headers: otroHeaders });
    const clienteAjeno = await makeCliente({ userId: otro._id, headers: otroHeaders });
    const { batch } = await makeLoteConCosecha({ userId: user._id, headers });

    const r1 = await callRoute(POST, {
      method: "POST",
      headers,
      body: { fecha: hoy(), items: [{ batchId: ajeno._id, kg: 1, precioPorKg: 1 }], medioPago: "efectivo", cobrada: false },
    });
    expect(r1.status).toBe(404);
    expect(r1.json.code).toBe("lote_no_encontrado");

    const r2 = await callRoute(POST, {
      method: "POST",
      headers,
      body: {
        fecha: hoy(),
        clienteId: clienteAjeno._id,
        items: [{ batchId: batch._id, kg: 1, precioPorKg: 1 }],
        medioPago: "efectivo",
        cobrada: false,
      },
    });
    expect(r2.status).toBe(404);
    expect(r2.json.code).toBe("cliente_no_encontrado");

    const r3 = await callRoute(POST, {
      method: "POST",
      headers,
      body: { fecha: hoy(), items: [{ batchId: "no-es-un-id", kg: 1, precioPorKg: 1 }], medioPago: "efectivo", cobrada: false },
    });
    expect(r3.status).toBe(404);
  });

  it("401 sin auth", async () => {
    const { status } = await callRoute(POST, { method: "POST", body: {} });
    expect(status).toBe(401);
  });
});

describe("GET /api/ventas", () => {
  it("lista las ventas del usuario, mas nuevas primero, con filtros batchId/clienteId/cobro", async () => {
    const { batch: a } = await makeLoteConCosecha({ userId: user._id, headers, cosechadoKg: 5 });
    const { batch: b } = await makeLoteConCosecha({ userId: user._id, headers, cosechadoKg: 5 });
    const cliente = await makeCliente({ userId: user._id, headers });

    const v1 = await makeVenta({
      userId: user._id,
      headers,
      fecha: "2026-01-01",
      clienteId: cliente._id,
      items: [{ batchId: a._id, kg: 1, precioPorKg: 100 }],
    });
    const v2 = await makeVenta({
      userId: user._id,
      headers,
      fecha: "2026-02-01",
      cobrada: true,
      items: [{ batchId: b._id, kg: 1, precioPorKg: 100 }],
    });
    const v3 = await makeVenta({
      userId: user._id,
      headers,
      fecha: "2026-02-01",
      items: [
        { batchId: a._id, kg: 1, precioPorKg: 100 },
        { batchId: b._id, kg: 1, precioPorKg: 100 },
      ],
    });

    // Otro usuario: no aparece.
    const otro = await makeUser();
    const otroHeaders = authHeaders(otro);
    const { batch: ajeno } = await makeLoteConCosecha({ userId: otro._id, headers: otroHeaders });
    await makeVenta({ userId: otro._id, headers: otroHeaders, items: [{ batchId: ajeno._id, kg: 1, precioPorKg: 1 }] });

    const ids = async (searchParams?: Record<string, string>) => {
      const { status, json } = await callRoute(GET, { headers, searchParams });
      expect(status).toBe(200);
      return json.data.map((v: { _id: string }) => v._id);
    };

    // fecha desc, y a igual fecha createdAt desc.
    expect(await ids()).toEqual([v3._id, v2._id, v1._id]);
    expect(await ids({ batchId: a._id })).toEqual([v3._id, v1._id]);
    expect(await ids({ clienteId: cliente._id })).toEqual([v1._id]);
    expect(await ids({ cobro: "pendiente" })).toEqual([v3._id, v1._id]);
    expect(await ids({ cobro: "cobrada" })).toEqual([v2._id]);
    expect(await ids({ batchId: "basura" })).toEqual([]);

    const { json } = await callRoute(GET, { headers });
    expect(json.data[0].total).toBe(200);
    expect(json.data[0].items[0].batchId.numeroLote).toBeDefined();
  });
});
