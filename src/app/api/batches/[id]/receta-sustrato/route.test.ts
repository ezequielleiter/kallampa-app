import { describe, it, expect, beforeEach } from "vitest";
import { PUT, DELETE } from "./route";
import { GET as GET_BATCH } from "@/app/api/batches/[id]/route";
import Batch from "@/models/Batch";
import { callRoute, makeBatch, makeUser, authHeaders } from "@/test-utils/api-test-helpers";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
});

const receta = {
  base: "pellets",
  pelletsKg: 5,
  aguaL: 6.5,
  calKg: 0.1,
  granoKg: 1,
  fecha: "2026-10-01",
  notas: "  Mezcla estandar  ",
};

const guardar = (id: string, body: unknown, h = headers) =>
  callRoute(PUT, { method: "PUT", headers: h, params: { id }, body });
const quitar = (id: string, h = headers) =>
  callRoute(DELETE, { method: "DELETE", headers: h, params: { id } });
const detalle = (id: string) => callRoute(GET_BATCH, { headers, params: { id } });

describe("PUT /api/batches/[id]/receta-sustrato", () => {
  it("guarda la receta y se ve en el detalle del lote", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });

    const res = await guardar(batch._id, receta);

    expect(res.status).toBe(200);
    expect(res.json.data).toMatchObject({
      base: "pellets",
      pelletsKg: 5,
      aguaL: 6.5,
      calKg: 0.1,
      granoKg: 1,
      notas: "Mezcla estandar",
    });
    expect(res.json.data.fecha.slice(0, 10)).toBe("2026-10-01");
    expect(res.json.data.createdAt).toBeTruthy();
    expect(res.json.data._id).toBeUndefined();

    const { json } = await detalle(batch._id);
    expect(json.data.recetaSustrato).toMatchObject({ base: "pellets", pelletsKg: 5 });
  });

  it("un segundo PUT reemplaza la receta", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    await guardar(batch._id, receta);

    const res = await guardar(batch._id, {
      base: "grano",
      pelletsKg: 3,
      aguaL: 0,
      calKg: 0,
      granoKg: 2,
      fecha: "2026-10-02",
      notas: "",
    });

    expect(res.status).toBe(200);
    const { json } = await detalle(batch._id);
    expect(json.data.recetaSustrato).toMatchObject({
      base: "grano",
      pelletsKg: 3,
      aguaL: 0,
      calKg: 0,
      granoKg: 2,
    });
    expect(json.data.recetaSustrato.notas).toBeUndefined();
  });

  it("guarda la receta por tachos con su configuracion", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    const tachos = { cantidad: 3, capacidad: 10, unidad: "L", densidadKgL: 0.6 };

    const res = await guardar(batch._id, { ...receta, base: "tachos", tachos });

    expect(res.status).toBe(200);
    expect(res.json.data).toMatchObject({ base: "tachos", tachos });
    const { json } = await detalle(batch._id);
    expect(json.data.recetaSustrato.tachos).toMatchObject(tachos);
  });

  it("descarta los tachos si la base no es tachos", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });

    const res = await guardar(batch._id, {
      ...receta,
      tachos: { cantidad: 2, capacidad: 10, unidad: "kg" },
    });

    expect(res.status).toBe(200);
    expect(res.json.data.tachos).toBeUndefined();
  });

  it("400 con base tachos y tachos faltantes o invalidos", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });

    for (const tachos of [
      undefined,
      { cantidad: 0, capacidad: 10, unidad: "kg" },
      { cantidad: 1.5, capacidad: 10, unidad: "kg" },
      { cantidad: 2, capacidad: 0, unidad: "kg" },
      { cantidad: 2, capacidad: 10, unidad: "m3" },
      { cantidad: 2, capacidad: 10, unidad: "L" },
    ]) {
      const res = await guardar(batch._id, { ...receta, base: "tachos", tachos });
      expect(res.status).toBe(400);
    }
  });

  it("400 con datos invalidos", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    const { pelletsKg: _omit, ...sinPellets } = receta;
    void _omit;

    for (const body of [
      { ...receta, aguaL: -1 },
      { ...receta, calKg: -0.5 },
      { ...receta, pelletsKg: 0 },
      sinPellets,
      { ...receta, granoKg: 0 },
      { ...receta, base: "aserrin" },
      { ...receta, notas: "x".repeat(2001) },
    ]) {
      expect((await guardar(batch._id, body)).status).toBe(400);
    }

    const { json } = await detalle(batch._id);
    expect(json.data.recetaSustrato).toBeUndefined();
  });

  it("404 en un lote de otro usuario", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    const otro = await makeUser();

    expect((await guardar(batch._id, receta, authHeaders(otro))).status).toBe(404);
    expect((await quitar(batch._id, authHeaders(otro))).status).toBe(404);
  });

  it("401 sin autenticacion", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });

    expect((await guardar(batch._id, receta, {})).status).toBe(401);
    expect((await quitar(batch._id, {})).status).toBe(401);
  });
});

describe("DELETE /api/batches/[id]/receta-sustrato", () => {
  it("quita la receta del lote", async () => {
    const batch = await makeBatch({ userId: user._id, headers, cantidadFrascos: 1 });
    await guardar(batch._id, receta);

    const res = await quitar(batch._id);

    expect(res.status).toBe(200);
    expect(res.json.data).toBeNull();
    const { json } = await detalle(batch._id);
    expect(json.data.recetaSustrato).toBeUndefined();
    const raw = await Batch.findById(batch._id).lean();
    expect(raw).not.toHaveProperty("recetaSustrato");
  });
});
