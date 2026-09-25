import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GET as GET_SERIE } from "./[id]/dispositivos/[dispositivoId]/serie/route";
import { POST as POST_DISPOSITIVO } from "./[id]/dispositivos/route";
import { PATCH as PATCH_DISPOSITIVO } from "./[id]/dispositivos/[dispositivoId]/route";
import { GET as GET_EQUIPOS } from "@/app/api/monitoreo/equipos/route";
import {
  callRoute,
  makeUser,
  authHeaders,
  makeInvernadero,
} from "@/test-utils/api-test-helpers";

const TOKEN = "token-secreto-de-prueba-123";
const ENV = {
  INFLUX_URL: "https://influx.test",
  INFLUX_ORG: "mi-org",
  INFLUX_BUCKET: "cultivo",
  INFLUX_TOKEN: TOKEN,
};

let headers: Record<string, string>;
let invernaderoId: string;
let dispositivoId: string;
let fetchMock: ReturnType<typeof vi.fn>;

function csvResponse(body: string, status = 200) {
  return new Response(body, { status, headers: { "content-type": "application/csv" } });
}

// 1ra consulta: marcas crudas (muestreo cada 5 min); 2da: serie agregada.
const MUESTRAS = [
  ",result,table,_time",
  ",_result,0,2026-09-25T10:20:00Z",
  ",_result,0,2026-09-25T10:15:00Z",
  ",_result,0,2026-09-25T10:10:00Z",
  ",_result,0,2026-09-25T10:05:00Z",
].join("\n");
const SERIE = [
  ",result,table,_time,calefaccion_seg,temperatura",
  ",_result,0,2026-09-25T10:05:00Z,45,21.3",
  ",_result,0,2026-09-25T10:10:00Z,0,",
].join("\n");

beforeEach(async () => {
  for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);

  const user = await makeUser();
  headers = authHeaders(user);
  invernaderoId = (await makeInvernadero({ userId: user._id, headers }))._id;
  const { json } = await callRoute(POST_DISPOSITIVO, {
    method: "POST",
    headers,
    params: { id: invernaderoId },
    body: { nombre: "Sensor 1", dominio: "kallampa-0c2cc8.local", influxId: "0C2CC8", tempMin: 18, tempMax: 24 },
  });
  dispositivoId = json.data.dispositivos[0]._id;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function pedirSerie(searchParams: Record<string, string> = { range: "1h" }, h = headers) {
  return callRoute(GET_SERIE, { headers: h, params: { id: invernaderoId, dispositivoId }, searchParams });
}

describe("serie de monitoreo", () => {
  it("consulta Influx del lado del servidor y devuelve filas sin exponer el token", async () => {
    fetchMock.mockResolvedValueOnce(csvResponse(MUESTRAS)).mockResolvedValueOnce(csvResponse(SERIE));
    const { status, json } = await pedirSerie({ range: "1h", tipo: "calefaccion" });

    expect(status).toBe(200);
    // Muestreo cada 5 min > ventana de 1h (1 min) → ventana 300 s
    expect(json.data.windowSec).toBe(300);
    expect(json.data.rows).toEqual([
      { t: Date.parse("2026-09-25T10:05:00Z"), valor: 21.3, onSeg: 45 },
      { t: Date.parse("2026-09-25T10:10:00Z"), valor: null, onSeg: 0 },
    ]);
    expect(json.data.hasta - json.data.desde).toBe(3600 * 1000);

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe("https://influx.test/api/v2/query?org=mi-org");
    expect(init.headers.Authorization).toBe(`Token ${TOKEN}`);
    const query = JSON.parse(init.body).query as string;
    expect(query).toContain('r.id == "0c2cc8"');
    expect(query).toContain("range(start: -1h)");
    expect(query).toContain("every: 300s");
    expect(query).not.toContain(TOKEN);
    expect(JSON.stringify(json)).not.toContain(TOKEN);
  });

  it("usa humedad + humidificador para tipo=humedad", async () => {
    fetchMock.mockResolvedValueOnce(csvResponse("")).mockResolvedValueOnce(
      csvResponse(",result,table,_time,humidificador_seg,humedad\n,_result,0,2026-09-25T10:00:00Z,120,85.2")
    );
    const { json } = await pedirSerie({ range: "24h", tipo: "humedad" });
    expect(json.data.windowSec).toBe(300); // ventana por defecto de 24h
    expect(json.data.rows[0]).toMatchObject({ valor: 85.2, onSeg: 120 });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).query).toContain('"humidificador_seg"');
  });

  it("valida rango y tipo", async () => {
    expect((await pedirSerie({ range: "3d" })).status).toBe(400);
    expect((await pedirSerie({ range: "1h", tipo: "co2" })).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("503 si faltan las variables INFLUX_*", async () => {
    vi.stubEnv("INFLUX_TOKEN", "");
    const { status, json } = await pedirSerie();
    expect(status).toBe(503);
    expect(json.code).toBe("influx_no_configurado");
  });

  it("traduce 401 de Influx a influx_sin_permiso sin filtrar el cuerpo", async () => {
    fetchMock.mockResolvedValueOnce(new Response(`{"message":"unauthorized ${TOKEN}"}`, { status: 401 }));
    const { status, json } = await pedirSerie();
    expect(status).toBe(502);
    expect(json.code).toBe("influx_sin_permiso");
    expect(JSON.stringify(json)).not.toContain(TOKEN);
  });

  it("error de red → influx_sin_conexion", async () => {
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const { json } = await pedirSerie();
    expect(json.code).toBe("influx_sin_conexion");
  });

  it("409 si el dispositivo no tiene influxId", async () => {
    await callRoute(PATCH_DISPOSITIVO, {
      method: "PATCH",
      headers,
      params: { id: invernaderoId, dispositivoId },
      body: { influxId: null },
    });
    const { status, json } = await pedirSerie();
    expect(status).toBe(409);
    expect(json.code).toBe("dispositivo_sin_influx");
  });

  it("otra cuenta recibe 404 y no se consulta Influx", async () => {
    const otro = authHeaders(await makeUser());
    expect((await pedirSerie({ range: "1h" }, otro)).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("campos de monitoreo del dispositivo", () => {
  it("normaliza el influxId y valida su formato", async () => {
    const r = await callRoute(PATCH_DISPOSITIVO, {
      method: "PATCH",
      headers,
      params: { id: invernaderoId, dispositivoId },
      body: { influxId: "zz12" },
    });
    expect(r.status).toBe(400);
  });

  it("exige min < max, tambien contra el valor ya guardado", async () => {
    const mal = await callRoute(PATCH_DISPOSITIVO, {
      method: "PATCH",
      headers,
      params: { id: invernaderoId, dispositivoId },
      body: { tempMin: 25 }, // tempMax guardado = 24
    });
    expect(mal.status).toBe(400);
    expect(mal.json.code).toBe("rango_min_max_invalido");

    const bien = await callRoute(PATCH_DISPOSITIVO, {
      method: "PATCH",
      headers,
      params: { id: invernaderoId, dispositivoId },
      body: { humMin: 80, humMax: 90, tempMax: null },
    });
    expect(bien.status).toBe(200);
    expect(bien.json.data.dispositivos[0]).toMatchObject({ influxId: "0c2cc8", tempMin: 18, humMin: 80, humMax: 90 });
    expect(bien.json.data.dispositivos[0].tempMax).toBeUndefined();
  });
});

describe("equipos de InfluxDB", () => {
  it("lista ids con su ultimo device, sin duplicados", async () => {
    fetchMock.mockResolvedValueOnce(
      csvResponse(
        [",result,table,id,device", ",_result,0,0c2cc8,kallampa-0c2cc8", ",_result,0,a1b2c3,fungi-a1b2c3", ",_result,0,no-hex,x"].join("\n")
      )
    );
    const { status, json } = await callRoute(GET_EQUIPOS, { headers });
    expect(status).toBe(200);
    expect(json.data).toEqual([
      { id: "a1b2c3", device: "fungi-a1b2c3" },
      { id: "0c2cc8", device: "kallampa-0c2cc8" },
    ]);
  });
});
