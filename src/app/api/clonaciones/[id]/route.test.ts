import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "./route";
import {
  callRoute,
  makeClonacion,
  colonizarPlacas,
  makeFrascoLiquido,
  makeBatch,
  colonizarJars,
  makeUser,
  authHeaders,
} from "@/test-utils/api-test-helpers";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

describe("GET /api/clonaciones/[id]", () => {
  it("devuelve la clonacion con sus placas y frascos liquidos (origenPlacaId poblado)", async () => {
    const clonacion = await makeClonacion({ userId: user._id, headers, cantidadPlacas: 2 });
    const [placaId] = await colonizarPlacas([clonacion.placas[0]], { userId: user._id, headers });
    const frasco = await makeFrascoLiquido({ userId: user._id, headers, origenPlacaId: placaId });

    const { status, json } = await callRoute(GET, { headers, params: { id: clonacion._id } });

    expect(status).toBe(200);
    expect(json.data.numeroLote).toBe(clonacion.numeroLote);
    expect(json.data.placas).toHaveLength(2);
    expect(json.data.frascosLiquidos).toHaveLength(1);
    expect(json.data.frascosLiquidos[0].etiqueta).toBe(frasco.etiqueta);
    expect(json.data.frascosLiquidos[0].origenPlacaId).toHaveProperty("numeroPlaca");
  });

  it("404 si la clonacion no existe", async () => {
    const { status } = await callRoute(GET, { headers, params: { id: "000000000000000000000000" } });
    expect(status).toBe(404);
  });

  it("popula origenJarId/origenBatchId cuando la clonacion viene de un jar", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    const [jarId] = await colonizarJars(batch.jars, { userId: user._id, headers });
    const clonacion = await makeClonacion({
      userId: user._id,
      headers,
      origenJarId: jarId,
      cantidadPlacas: 1,
      diasEsperados: 15,
    });

    const { status, json } = await callRoute(GET, { headers, params: { id: clonacion._id } });

    expect(status).toBe(200);
    expect(json.data.origenJarId).toHaveProperty("numeroGuia");
    expect(json.data.origenBatchId).toHaveProperty("numeroLote", batch.numeroLote);
  });
});
