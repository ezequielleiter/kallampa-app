import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { DELETE } from "./[id]/route";
import { GET as getStock } from "@/app/api/stock/route";
import {
  callRoute,
  makeUser,
  authHeaders,
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

async function disponible(batchId: string) {
  const { json } = await callRoute(getStock, { headers });
  return json.data.find((s: { batchId: string }) => s.batchId === batchId)?.disponibleKg;
}

const merma = (batchId: string, kg: number, extra: Record<string, unknown> = {}) => ({
  batchId,
  fecha: "2026-05-02",
  kg,
  motivo: "vencido",
  ...extra,
});

describe("/api/mermas", () => {
  it("POST reduce el stock; GET lista por lote; DELETE lo restaura", async () => {
    const { batch } = await makeLoteConCosecha({ userId: user._id, headers, cosechadoKg: 3 });
    const { batch: otroLote } = await makeLoteConCosecha({ userId: user._id, headers, cosechadoKg: 3 });
    await makeVenta({ userId: user._id, headers, items: [{ batchId: batch._id, kg: 2, precioPorKg: 8000 }] });

    const { status, json } = await callRoute(POST, {
      method: "POST",
      headers,
      body: merma(batch._id, 0.5, { motivo: "regalado", notas: "a la vecina" }),
    });
    expect(status).toBe(201);
    expect(json.data).toMatchObject({ kg: 0.5, motivo: "regalado", notas: "a la vecina" });
    expect(await disponible(batch._id)).toBe(0.5);

    await callRoute(POST, { method: "POST", headers, body: merma(otroLote._id, 1) });
    const lista = await callRoute(GET, { headers, searchParams: { batchId: batch._id } });
    expect(lista.json.data).toHaveLength(1);
    expect((await callRoute(GET, { headers })).json.data).toHaveLength(2);

    const del = await callRoute(DELETE, { method: "DELETE", headers, params: { id: json.data._id } });
    expect(del.status).toBe(200);
    expect(await disponible(batch._id)).toBe(1);
  });

  it("409 stock_insuficiente si supera lo disponible", async () => {
    const { batch } = await makeLoteConCosecha({ userId: user._id, headers, cosechadoKg: 1 });
    const { status, json } = await callRoute(POST, { method: "POST", headers, body: merma(batch._id, 1.25) });
    expect(status).toBe(409);
    expect(json.code).toBe("stock_insuficiente");
    expect(json.error).toBe(`El lote ${batch.numeroLote} tiene 1 kg disponibles`);
  });

  it("400 con motivo invalido o kg <= 0; 404 con lote ajeno", async () => {
    const { batch } = await makeLoteConCosecha({ userId: user._id, headers });
    expect((await callRoute(POST, { method: "POST", headers, body: merma(batch._id, 1, { motivo: "robado" }) })).status).toBe(400);
    expect((await callRoute(POST, { method: "POST", headers, body: merma(batch._id, 0) })).status).toBe(400);

    const otro = await makeUser();
    const r = await callRoute(POST, { method: "POST", headers: authHeaders(otro), body: merma(batch._id, 1) });
    expect(r.status).toBe(404);
    expect(r.json.code).toBe("lote_no_encontrado");
  });

  it("DELETE 404 merma_no_encontrada si no existe o es de otro usuario", async () => {
    const { batch } = await makeLoteConCosecha({ userId: user._id, headers });
    const { json } = await callRoute(POST, { method: "POST", headers, body: merma(batch._id, 1) });
    const otro = await makeUser();
    const r = await callRoute(DELETE, { method: "DELETE", headers: authHeaders(otro), params: { id: json.data._id } });
    expect(r.status).toBe(404);
    expect(r.json.code).toBe("merma_no_encontrada");
    expect((await callRoute(DELETE, { method: "DELETE", headers, params: { id: NONEXISTENT_ID } })).status).toBe(404);
  });
});
