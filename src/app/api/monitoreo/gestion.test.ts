import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "./gestion/route";
import { POST as POST_ESTADO } from "@/app/api/recipientes/[id]/estado/route";
import { PATCH as PATCH_JAR } from "@/app/api/jars/[id]/route";
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

const contaminar = (id: string, h = headers) =>
  callRoute(PATCH_JAR, { method: "PATCH", headers: h, params: { id }, body: { estado: "contaminado" } });

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

async function loteConRecipiente() {
  const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 3 });
  const [j1, j2] = batch.jars;
  await colonizarJars([j1, j2], { userId: user._id, headers });
  await contaminar(batch.jars[2]._id);
  const rec = await makeRecipiente({ userId: user._id, headers, batchId: batch._id, origenFrascoIds: [j1._id] });
  await fructificarRecipiente(rec._id, { userId: user._id, headers });
  return batch;
}

describe("GET /api/monitoreo/gestion", () => {
  it("cuenta frascos y recipientes vivos", async () => {
    await loteConRecipiente();
    const { status, json } = await callRoute(GET, { headers });
    expect(status).toBe(200);
    expect(json.data.frascos).toEqual({ colonizando: 0, colonizado: 1, contaminados30d: 1 });
    expect(json.data.recipientes.fructificando).toBe(1);
  });

  it("lotes activos con sus conteos", async () => {
    await loteConRecipiente();
    const { json } = await callRoute(GET, { headers });
    expect(json.data.lotesActivos[0]).toMatchObject({ frascosActivos: 1, fructificando: 1, incubando: 0 });
  });

  it("excluye lotes finalizados", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 2 });
    const [j1, j2] = batch.jars;
    await colonizarJars([j1], { userId: user._id, headers });
    await contaminar(j2._id);
    const rec = await makeRecipiente({ userId: user._id, headers, batchId: batch._id, origenFrascoIds: [j1._id] });
    await callRoute(POST_ESTADO, { method: "POST", headers, params: { id: rec._id }, body: { estado: "contaminado" } });
    const { json } = await callRoute(GET, { headers });
    expect(json.data.lotesActivos).toEqual([]);
    expect(json.data.recipientes.contaminados30d).toBe(1);
  });

  it("no mezcla usuarios", async () => {
    await loteConRecipiente();
    const otro = await makeUser();
    const { json } = await callRoute(GET, { headers: authHeaders(otro) });
    expect(json.data.frascos).toEqual({ colonizando: 0, colonizado: 0, contaminados30d: 0 });
    expect(json.data.lotesActivos).toEqual([]);
  });
});
