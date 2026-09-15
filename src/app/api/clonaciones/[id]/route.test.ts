import { describe, it, expect } from "vitest";
import { GET } from "./route";
import {
  callRoute,
  makeClonacion,
  colonizarPlacas,
  makeFrascoLiquido,
} from "@/test-utils/api-test-helpers";

describe("GET /api/clonaciones/[id]", () => {
  it("devuelve la clonacion con sus placas y frascos liquidos (origenPlacaId poblado)", async () => {
    const clonacion = await makeClonacion({ cantidadPlacas: 2 });
    const [placaId] = await colonizarPlacas([clonacion.placas[0]]);
    const frasco = await makeFrascoLiquido({ origenPlacaId: placaId });

    const { status, json } = await callRoute(GET, { params: { id: clonacion._id } });

    expect(status).toBe(200);
    expect(json.data.numeroLote).toBe(clonacion.numeroLote);
    expect(json.data.placas).toHaveLength(2);
    expect(json.data.frascosLiquidos).toHaveLength(1);
    expect(json.data.frascosLiquidos[0].etiqueta).toBe(frasco.etiqueta);
    expect(json.data.frascosLiquidos[0].origenPlacaId).toHaveProperty("numeroPlaca");
  });

  it("404 si la clonacion no existe", async () => {
    const { status } = await callRoute(GET, { params: { id: "000000000000000000000000" } });
    expect(status).toBe(404);
  });
});
