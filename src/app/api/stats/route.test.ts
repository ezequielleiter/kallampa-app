import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "./route";
import {
  callRoute,
  makeBatch,
  colonizarJars,
  makeRecipiente,
  fructificarRecipiente,
  makeUser,
  authHeaders,
} from "@/test-utils/api-test-helpers";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

// No repetimos aca el detalle de metrics.ts (ya cubierto exhaustivamente en
// src/lib/metrics.test.ts): solo un smoke test de que /api/stats arma la
// forma de respuesta esperada con un par de lotes de fixture.
describe("GET /api/stats", () => {
  it("devuelve la forma esperada (kpis, lotes, distribucionPorEstado, agregados, lotesDemorados)", async () => {
    // Lote 1: activo, con un recipiente incubando.
    const activo = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    const [jarActivo] = await colonizarJars(activo.jars, { userId: user._id, headers });
    await makeRecipiente({ userId: user._id, headers, batchId: activo._id, origenFrascoIds: [jarActivo] });

    // Lote 2: se completa hasta 'finalizado' via su unico recipiente.
    const finalizado = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    const [jarFinalizado] = await colonizarJars(finalizado.jars, { userId: user._id, headers });
    const recipiente = await makeRecipiente({
      userId: user._id,
      headers,
      batchId: finalizado._id,
      origenFrascoIds: [jarFinalizado],
    });
    await fructificarRecipiente(recipiente._id, { userId: user._id, headers });
    const { POST: addOleada } = await import("@/app/api/recipientes/[id]/oleadas/route");
    await callRoute(addOleada, {
      method: "POST",
      headers,
      params: { id: recipiente._id },
      body: { fecha: new Date().toISOString(), pesoKg: 3 },
    });
    const { POST: marcarEstado } = await import("@/app/api/recipientes/[id]/estado/route");
    await callRoute(marcarEstado, {
      method: "POST",
      headers,
      params: { id: recipiente._id },
      body: { estado: "finalizado" },
    });

    const { status, json } = await callRoute(GET, { headers });

    expect(status).toBe(200);
    const data = json.data;

    expect(data.kpis).toMatchObject({
      totalLotes: 2,
      lotesActivos: 1,
      lotesFinalizados: 1,
      lotesDemorados: expect.any(Number),
      pesoTotalProducidoKg: 3,
    });
    expect(Array.isArray(data.lotes)).toBe(true);
    expect(data.lotes).toHaveLength(2);
    expect(Array.isArray(data.distribucionPorEstado)).toBe(true);
    // Distribucion por estado de RECIPIENTE (ver comentario en route.ts).
    expect(data.distribucionPorEstado.map((d: { label: string }) => d.label)).toEqual([
      "incubando",
      "fructificando",
      "finalizado",
      "contaminado",
      "descartado",
    ]);
    expect(data.agregados).toHaveProperty("porHongo");
    expect(data.agregados).toHaveProperty("porGrano");
    expect(data.agregados).toHaveProperty("porSustrato");
    expect(Array.isArray(data.lotesDemorados)).toBe(true);

    expect(data.lotes.map((l: { numeroLote: string }) => l.numeroLote)).toContain(
      activo.numeroLote
    );

    const loteFinalizado = data.lotes.find(
      (l: { numeroLote: string }) => l.numeroLote === finalizado.numeroLote
    );
    expect(loteFinalizado.resumen.estadoDerivado).toBe("finalizado");
    expect(loteFinalizado.resumen.pesoTotalCosechado).toBe(3);
  });
});
