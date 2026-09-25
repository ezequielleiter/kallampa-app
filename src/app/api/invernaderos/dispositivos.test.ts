import { describe, it, expect, beforeEach } from "vitest";
import { GET as GET_DETALLE } from "./[id]/route";
import { POST } from "./[id]/dispositivos/route";
import { PATCH, DELETE } from "./[id]/dispositivos/[dispositivoId]/route";
import {
  callRoute,
  makeUser,
  authHeaders,
  makeInvernadero,
} from "@/test-utils/api-test-helpers";

let user: Awaited<ReturnType<typeof makeUser>>;
let headers: Record<string, string>;
let invernaderoId: string;

beforeEach(async () => {
  user = await makeUser();
  headers = authHeaders(user);
  invernaderoId = (await makeInvernadero({ userId: user._id, headers, nombre: "Carpa 1" }))._id;
});

async function agregar(body: Record<string, unknown>, h = headers) {
  return callRoute(POST, { method: "POST", headers: h, params: { id: invernaderoId }, body });
}

describe("dispositivos de monitoreo de un invernadero", () => {
  it("asocia un dispositivo normalizando el dominio", async () => {
    const { status, json } = await agregar({
      nombre: "Sensor 1",
      dominio: "  http://Sensor-Carpa1.local/ ",
    });
    expect(status).toBe(201);
    expect(json.data.dispositivos).toHaveLength(1);
    expect(json.data.dispositivos[0]).toMatchObject({
      nombre: "Sensor 1",
      dominio: "Sensor-Carpa1.local",
    });
  });

  it("acepta IP con puerto y ruta", async () => {
    const { status, json } = await agregar({ nombre: "Sensor 2", dominio: "https://192.168.1.50:8080/panel" });
    expect(status).toBe(201);
    expect(json.data.dispositivos[0].dominio).toBe("192.168.1.50:8080/panel");
  });

  it("rechaza dominios invalidos y nombre vacio con 400", async () => {
    for (const body of [
      { nombre: "S", dominio: "sensor carpa.local" },
      { nombre: "S", dominio: "http://" },
      { nombre: "S", dominio: "" },
      { nombre: "", dominio: "sensor.local" },
    ]) {
      const { status } = await agregar(body);
      expect(status).toBe(400);
    }
  });

  it("rechaza nombre repetido dentro del invernadero con 409", async () => {
    await agregar({ nombre: "Sensor 1", dominio: "a.local" });
    const { status, json } = await agregar({ nombre: "Sensor 1", dominio: "b.local" });
    expect(status).toBe(409);
    expect(json.code).toBe("dispositivo_nombre_en_uso");
  });

  it("edita y quita un dispositivo", async () => {
    const { json } = await agregar({ nombre: "Sensor 1", dominio: "a.local" });
    const dispositivoId = json.data.dispositivos[0]._id;

    const editado = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: invernaderoId, dispositivoId },
      body: { dominio: "http://b.local/" },
    });
    expect(editado.status).toBe(200);
    expect(editado.json.data.dispositivos[0]).toMatchObject({ nombre: "Sensor 1", dominio: "b.local" });

    const quitado = await callRoute(DELETE, {
      method: "DELETE",
      headers,
      params: { id: invernaderoId, dispositivoId },
    });
    expect(quitado.status).toBe(200);
    expect(quitado.json.data.dispositivos).toHaveLength(0);
  });

  it("PATCH rechaza renombrar a un nombre en uso con 409", async () => {
    await agregar({ nombre: "Sensor 1", dominio: "a.local" });
    const { json } = await agregar({ nombre: "Sensor 2", dominio: "b.local" });
    const segundo = json.data.dispositivos[1]._id;
    const { status } = await callRoute(PATCH, {
      method: "PATCH",
      headers,
      params: { id: invernaderoId, dispositivoId: segundo },
      body: { nombre: "Sensor 1" },
    });
    expect(status).toBe(409);
  });

  it("el detalle del invernadero incluye sus dispositivos", async () => {
    await agregar({ nombre: "Sensor 1", dominio: "a.local" });
    const { status, json } = await callRoute(GET_DETALLE, { headers, params: { id: invernaderoId } });
    expect(status).toBe(200);
    expect(json.data.nombre).toBe("Carpa 1");
    expect(json.data.dispositivos.map((d: { nombre: string }) => d.nombre)).toEqual(["Sensor 1"]);
  });

  it("otra cuenta no puede ver, agregar ni quitar", async () => {
    const { json } = await agregar({ nombre: "Sensor 1", dominio: "a.local" });
    const dispositivoId = json.data.dispositivos[0]._id;
    const otro = authHeaders(await makeUser());

    expect((await callRoute(GET_DETALLE, { headers: otro, params: { id: invernaderoId } })).status).toBe(404);
    expect((await agregar({ nombre: "X", dominio: "x.local" }, otro)).status).toBe(404);
    const { status } = await callRoute(DELETE, {
      method: "DELETE",
      headers: otro,
      params: { id: invernaderoId, dispositivoId },
    });
    expect(status).toBe(404);
  });

  it("quitar un dispositivo inexistente da 404", async () => {
    const { status, json } = await callRoute(DELETE, {
      method: "DELETE",
      headers,
      params: { id: invernaderoId, dispositivoId: "64b000000000000000000000" },
    });
    expect(status).toBe(404);
    expect(json.code).toBe("dispositivo_no_encontrado");
  });
});
