import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "./route";
import { POST as postMerma } from "@/app/api/mermas/route";
import {
  callRoute,
  makeUser,
  authHeaders,
  makeBatch,
  makeFungusType,
  makeLoteConCosecha,
  makeVenta,
} from "@/test-utils/api-test-helpers";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

describe("GET /api/stock", () => {
  it("cosechado − vendido − merma por lote, solo lotes con cosecha, numeroLote desc", async () => {
    const hongo = await makeFungusType({ userId: user._id, headers, nombre: "Gírgola" });
    const { batch: a } = await makeLoteConCosecha({ userId: user._id, headers, cosechadoKg: 3, fungusTypeId: hongo._id });
    const { batch: b } = await makeLoteConCosecha({ userId: user._id, headers, cosechadoKg: 2 });
    await makeBatch({ userId: user._id, headers }); // sin cosecha: no aparece

    await makeVenta({ userId: user._id, headers, items: [{ batchId: a._id, kg: 2, precioPorKg: 8000 }] });
    await callRoute(postMerma, {
      method: "POST",
      headers,
      body: { batchId: a._id, fecha: "2026-05-01", kg: 0.5, motivo: "vencido" },
    });

    // Otro usuario con cosecha: no aparece.
    const otro = await makeUser();
    await makeLoteConCosecha({ userId: otro._id, headers: authHeaders(otro) });

    const { status, json } = await callRoute(GET, { headers });
    expect(status).toBe(200);
    expect(json.data.map((s: { batchId: string }) => s.batchId)).toEqual([b._id, a._id]);
    expect(json.data[1]).toEqual({
      batchId: a._id,
      numeroLote: a.numeroLote,
      hongo: "Gírgola",
      cosechadoKg: 3,
      vendidoKg: 2,
      mermaKg: 0.5,
      disponibleKg: 0.5,
    });
    expect(json.data[0]).toMatchObject({ cosechadoKg: 2, vendidoKg: 0, mermaKg: 0, disponibleKg: 2 });
  });

  it("vacio si no hay cosechas", async () => {
    const { json } = await callRoute(GET, { headers });
    expect(json.data).toEqual([]);
  });
});
