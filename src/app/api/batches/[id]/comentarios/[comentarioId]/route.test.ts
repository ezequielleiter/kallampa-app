import { describe, it, expect, beforeEach } from "vitest";
import { PATCH, DELETE } from "./route";
import { POST } from "../route";
import { callRoute, makeBatch, makeUser, authHeaders } from "@/test-utils/api-test-helpers";

const NONEXISTENT_ID = "507f1f77bcf86cd799439011";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;
let batchId: string;
let comentario: { _id: string; texto: string; createdAt: string; updatedAt: string };

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
  const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
  batchId = batch._id;
  const { json } = await callRoute(POST, {
    method: "POST",
    headers,
    params: { id: batchId },
    body: { texto: "Original" },
  });
  comentario = json.data[0];
});

describe("PATCH /api/batches/[id]/comentarios/[comentarioId]", () => {
  it("edita el texto y actualiza updatedAt", async () => {
    await new Promise((r) => setTimeout(r, 10));

    const { status, json } = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: batchId, comentarioId: comentario._id },
      body: { texto: "Editado" },
    });

    expect(status).toBe(200);
    expect(json.data[0].texto).toBe("Editado");
    expect(json.data[0].createdAt).toBe(comentario.createdAt);
    expect(json.data[0].updatedAt).not.toBe(comentario.updatedAt);
  });

  it("404 con un comentario inexistente o un lote ajeno", async () => {
    const inexistente = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: batchId, comentarioId: NONEXISTENT_ID },
      body: { texto: "x" },
    });
    expect(inexistente.status).toBe(404);

    const otro = await makeUser();
    const ajeno = await callRoute(PATCH, {
      method: "PATCH",
      headers: authHeaders(otro),
      params: { id: batchId, comentarioId: comentario._id },
      body: { texto: "x" },
    });
    expect(ajeno.status).toBe(404);
  });
});

describe("DELETE /api/batches/[id]/comentarios/[comentarioId]", () => {
  it("saca el comentario del hilo", async () => {
    const { status, json } = await callRoute(DELETE, {
      method: "DELETE",
      headers,
      params: { id: batchId, comentarioId: comentario._id },
    });

    expect(status).toBe(200);
    expect(json.data).toEqual([]);
  });

  it("404 con un comentario inexistente o un lote ajeno", async () => {
    const inexistente = await callRoute(DELETE, {
      method: "DELETE",
      headers,
      params: { id: batchId, comentarioId: NONEXISTENT_ID },
    });
    expect(inexistente.status).toBe(404);

    const otro = await makeUser();
    const ajeno = await callRoute(DELETE, {
      method: "DELETE",
      headers: authHeaders(otro),
      params: { id: batchId, comentarioId: comentario._id },
    });
    expect(ajeno.status).toBe(404);
  });
});
