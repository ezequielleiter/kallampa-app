import { describe, it, expect } from "vitest";
import { GET } from "./route";
import { POST as discard } from "../batches/[id]/discard/route";
import { callRoute, makeBatch, advanceToCosecha } from "@/test-utils/api-test-helpers";

// No repetimos aca el detalle de metrics.ts (ya cubierto exhaustivamente en
// src/lib/metrics.test.ts): solo un smoke test de que /api/stats arma la
// forma de respuesta esperada con un par de lotes de fixture.
describe("GET /api/stats", () => {
  it("devuelve la forma esperada (kpis, lotes, distribucionPorEstado, agregados, lotesDemorados)", async () => {
    const activo = await makeBatch();
    const paraDescartar = await makeBatch();
    await callRoute(discard, {
      method: "POST",
      params: { id: paraDescartar._id },
      body: { motivo: "Descartado para stats de prueba" },
    });
    await advanceToCosecha(activo._id);

    const { status, json } = await callRoute(GET);

    expect(status).toBe(200);
    const data = json.data;

    expect(data.kpis).toMatchObject({
      totalLotes: expect.any(Number),
      lotesActivos: expect.any(Number),
      lotesFinalizados: expect.any(Number),
      lotesDescartados: expect.any(Number),
      lotesDemorados: expect.any(Number),
      pesoTotalProducidoKg: expect.any(Number),
    });
    expect(Array.isArray(data.lotes)).toBe(true);
    expect(Array.isArray(data.distribucionPorEstado)).toBe(true);
    expect(data.agregados).toHaveProperty("porHongo");
    expect(data.agregados).toHaveProperty("porGrano");
    expect(data.agregados).toHaveProperty("porSustrato");
    expect(Array.isArray(data.lotesDemorados)).toBe(true);

    // Por default no incluye descartados.
    expect(data.kpis.totalLotes).toBe(1);
    expect(data.lotes.map((l: { numeroLote: string }) => l.numeroLote)).toContain(
      activo.numeroLote
    );
  });

  it("incluirDescartados=true trae tambien los lotes descartados", async () => {
    const paraDescartar = await makeBatch();
    await callRoute(discard, {
      method: "POST",
      params: { id: paraDescartar._id },
      body: { motivo: "Descartado para stats de prueba" },
    });

    const { json } = await callRoute(GET, { searchParams: { incluirDescartados: "true" } });
    expect(json.data.kpis.totalLotes).toBe(1);
    expect(json.data.kpis.lotesDescartados).toBe(1);
  });
});
