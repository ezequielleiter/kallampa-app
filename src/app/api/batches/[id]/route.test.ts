import { describe, it, expect } from "vitest";
import { GET } from "./route";
import {
  callRoute,
  makeBatch,
  makeFungusType,
  colonizarJars,
  makeRecipiente,
  makeClonacion,
  makeClonacionDirecta,
  colonizarPlacas,
  makeFrascoLiquido,
} from "@/test-utils/api-test-helpers";

const NONEXISTENT_ID = "507f1f77bcf86cd799439011";

describe("GET /api/batches/[id]", () => {
  it("devuelve el detalle del batch con sus jars y recipientes (vacio si no hay ninguno)", async () => {
    const batch = await makeBatch({ cantidadFrascos: 2 });

    const { status, json } = await callRoute(GET, { params: { id: batch._id } });

    expect(status).toBe(200);
    expect(json.data.numeroLote).toBe(batch.numeroLote);
    expect(json.data.jars).toHaveLength(2);
    expect(json.data.recipientes).toEqual([]);
  });

  it("incluye los recipientes del lote con tipoSustratoId y origenFrascoIds poblados", async () => {
    const batch = await makeBatch({ cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars);
    const recipiente = await makeRecipiente({ batchId: batch._id, origenFrascoIds: [jarId] });

    const { json } = await callRoute(GET, { params: { id: batch._id } });

    expect(json.data.recipientes).toHaveLength(1);
    expect(json.data.recipientes[0]._id).toBe(recipiente._id);
    expect(json.data.recipientes[0].tipoSustratoId).toHaveProperty("nombre");
    expect(json.data.recipientes[0].origenFrascoIds[0]).toHaveProperty("numeroGuia");
  });

  it("si el lote se inicio desde un frasco de micelio liquido, incluye origenFrascoLiquidoId poblado (numeroGuia)", async () => {
    const clonacion = await makeClonacion({ cantidadPlacas: 1 });
    const [placaId] = await colonizarPlacas([clonacion.placas[0]]);
    const frasco = await makeFrascoLiquido({ origenPlacaId: placaId });

    const batch = await makeBatch({ cantidadFrascos: 1, origenFrascoLiquidoId: frasco._id });

    const { json } = await callRoute(GET, { params: { id: batch._id } });

    expect(json.data.origenFrascoLiquidoId).toHaveProperty("numeroGuia", frasco.numeroGuia);
    expect(json.data.fungusTypeId._id).toBe(clonacion.fungusTypeId);
  });

  it("un batch puede originarse de un frasco nacido de 'comprado' (sin placa), igual que de uno de 'placa'", async () => {
    const fungusType = await makeFungusType();
    const clonacion = await makeClonacionDirecta({
      origenProceso: "comprado",
      fungusTypeId: fungusType._id,
      cantidadFrascos: 1,
    });
    const frasco = clonacion.frascosLiquidos[0];

    const batch = await makeBatch({ cantidadFrascos: 1, origenFrascoLiquidoId: frasco._id });

    const { json } = await callRoute(GET, { params: { id: batch._id } });

    expect(json.data.origenFrascoLiquidoId).toHaveProperty("numeroGuia", frasco.numeroGuia);
    expect(json.data.fungusTypeId._id).toBe(fungusType._id);
  });

  it("404 en un id inexistente", async () => {
    const { status, json } = await callRoute(GET, { params: { id: NONEXISTENT_ID } });

    expect(status).toBe(404);
    expect(json.error).toMatch(/no encontrado/i);
  });
});
