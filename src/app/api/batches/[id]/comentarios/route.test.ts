import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "./route";
import { GET as GET_BATCH } from "@/app/api/batches/[id]/route";
import { GET as GET_NOTAS } from "@/app/api/notas/route";
import { callRoute, makeBatch, makeUser, authHeaders } from "@/test-utils/api-test-helpers";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

const comentar = (id: string, body: unknown, h = headers) =>
  callRoute(POST, { method: "POST", headers: h, params: { id }, body });

describe("POST /api/batches/[id]/comentarios", () => {
  it("agrega comentarios al hilo del lote, en orden cronologico", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });

    const primero = await comentar(batch._id, { texto: "  Grano un poco húmedo  " });
    await comentar(batch._id, { texto: "Se calentó la estufa" });

    expect(primero.status).toBe(201);
    expect(primero.json.data[0]).toMatchObject({ texto: "Grano un poco húmedo" });
    expect(primero.json.data[0]._id).toBeTruthy();
    expect(primero.json.data[0].createdAt).toBeTruthy();

    const { json } = await callRoute(GET_BATCH, { headers, params: { id: batch._id } });
    expect(json.data.comentarios.map((c: { texto: string }) => c.texto)).toEqual([
      "Grano un poco húmedo",
      "Se calentó la estufa",
    ]);
  });

  it("400 con texto vacio o demasiado largo", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });

    for (const texto of ["", "   ", "x".repeat(2001)]) {
      expect((await comentar(batch._id, { texto })).status).toBe(400);
    }
    expect((await comentar(batch._id, {})).status).toBe(400);
  });

  it("404 en un lote de otro usuario", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    const otro = await makeUser();

    const { status } = await comentar(batch._id, { texto: "hola" }, authHeaders(otro));

    expect(status).toBe(404);
  });

  it("los comentarios del lote no aparecen en la seccion Notas", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    await comentar(batch._id, { texto: "Solo del lote" });

    const { json } = await callRoute(GET_NOTAS, { headers });

    expect(json.data).toEqual([]);
  });
});
