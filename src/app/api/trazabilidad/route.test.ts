import { describe, it, expect } from "vitest";
import { GET } from "./route";
import {
  callRoute,
  makeBatch,
  colonizarJars,
  makeClonacion,
  colonizarPlacas,
  makeFrascoLiquido,
} from "@/test-utils/api-test-helpers";

describe("GET /api/trazabilidad", () => {
  it("trae lotes, clonaciones y frascosLiquidos con los datos suficientes para reconstruir la cadena Lote A -> Clonacion C -> Lote B", async () => {
    // Lote A
    const batchA = await makeBatch({ cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batchA.jars);

    // Clonacion C, a partir de un jar de A
    const clonacionC = await makeClonacion({ origenJarId: jarId, cantidadPlacas: 1, diasEsperados: 15 });
    const [placaId] = await colonizarPlacas(clonacionC.placas);
    const frasco = await makeFrascoLiquido({ origenPlacaId: placaId });

    // Lote B, a partir del frasco liquido de C
    const batchB = await makeBatch({ cantidadFrascos: 1, origenFrascoLiquidoId: frasco._id });

    const { status, json } = await callRoute(GET);

    expect(status).toBe(200);
    const { lotes, clonaciones, frascosLiquidos } = json.data;

    const loteA = lotes.find((l: { _id: string }) => l._id === batchA._id);
    const loteB = lotes.find((l: { _id: string }) => l._id === batchB._id);
    const cln = clonaciones.find((c: { _id: string }) => c._id === clonacionC._id);
    const frascoRow = frascosLiquidos.find((f: { _id: string }) => f._id === frasco._id);

    expect(loteA).toBeTruthy();
    expect(loteB).toBeTruthy();
    expect(cln).toBeTruthy();
    expect(frascoRow).toBeTruthy();

    // Lote A tiene su fungusTypeId poblado (con nombre) y resumen.
    expect(loteA.fungusTypeId).toHaveProperty("nombre");
    expect(loteA.resumen).toHaveProperty("estadoDerivado");

    // Clonacion C: origenTipo 'jar', origenBatchId apunta a A, origenJarId poblado.
    expect(cln.origenTipo).toBe("jar");
    expect(String(cln.origenBatchId)).toBe(batchA._id);
    expect(cln.origenJarId).toHaveProperty("numeroGuia");
    expect(cln.resumen).toHaveProperty("frascosLiquidosValidos");

    // Lote B: origenFrascoLiquidoId apunta al frasco de C.
    expect(String(loteB.origenFrascoLiquidoId)).toBe(frasco._id);

    // frascosLiquidos trae la pieza para cruzar frasco -> clonacionId.
    expect(String(frascoRow.clonacionId)).toBe(clonacionC._id);
    expect(frascoRow.etiqueta).toBe(frasco.etiqueta);

    // Con esto se puede reconstruir la cadena completa:
    // loteB.origenFrascoLiquidoId -> frascoRow._id -> frascoRow.clonacionId -> cln._id
    // -> cln.origenBatchId -> loteA._id
    expect(String(loteB.origenFrascoLiquidoId)).toBe(String(frascoRow._id));
    expect(String(frascoRow.clonacionId)).toBe(String(cln._id));
  });
});
