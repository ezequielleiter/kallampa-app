import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GET } from "./resumen/route";
import { POST as POST_DISPOSITIVO } from "@/app/api/invernaderos/[id]/dispositivos/route";
import { callRoute, makeUser, authHeaders, makeInvernadero } from "@/test-utils/api-test-helpers";

const TOKEN = "token-secreto-de-prueba-123";
const ENV = {
  INFLUX_URL: "https://influx.test",
  INFLUX_ORG: "mi-org",
  INFLUX_BUCKET: "cultivo",
  INFLUX_TOKEN: TOKEN,
};

let headers: Record<string, string>;
let invernaderoId: string;
let fetchMock: ReturnType<typeof vi.fn>;

const csv = (body: string) => new Response(body, { status: 200, headers: { "content-type": "application/csv" } });
const NOW = new Date().toISOString();

function responder(_url: unknown, init: { body: string }) {
  const q: string = JSON.parse(init.body).query;
  if (q.includes("uptime_s")) return Promise.resolve(csv(",result,table,id,_value\n,_result,0,0c2cc8,2"));
  if (q.includes('"actuadores"')) return Promise.resolve(csv(",result,table,id,humidificador_seg\n,_result,0,0c2cc8,864"));
  if (q.includes("aggregateWindow")) return Promise.resolve(csv(`,result,table,_time,id,temperatura\n,_result,0,${NOW},0c2cc8,21`));
  if (q.includes('"estado"')) return Promise.resolve(csv(`,result,table,_time,id,fw\n,_result,0,${NOW},0c2cc8,1.0`));
  return Promise.resolve(csv(`,result,table,_time,id,temperatura\n,_result,0,${NOW},0c2cc8,21`));
}

async function addDispositivo(h: Record<string, string>, id: string, influxId?: string) {
  await callRoute(POST_DISPOSITIVO, {
    method: "POST",
    headers: h,
    params: { id },
    body: { nombre: "Sensor 1", dominio: "kallampa-0c2cc8.local", ...(influxId ? { influxId } : {}), tempMin: 18, tempMax: 24 },
  });
}

beforeEach(async () => {
  for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
  fetchMock = vi.fn(responder);
  vi.stubGlobal("fetch", fetchMock);
  const user = await makeUser();
  headers = authHeaders(user);
  invernaderoId = (await makeInvernadero({ userId: user._id, headers }))._id;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("resumen de monitoreo", () => {
  it("arma el resumen por invernadero sin exponer el token", async () => {
    await addDispositivo(headers, invernaderoId, "0C2CC8");
    const { status, json } = await callRoute(GET, { headers });
    expect(status).toBe(200);
    const eq = json.data.invernaderos[0].equipos[0];
    expect(eq.influxId).toBe("0c2cc8");
    expect(eq.dia.reinicios).toBe(2);
    expect(eq.dia.usoPct.humidificador).toBe(1);
    expect(JSON.stringify(json)).not.toContain(TOKEN);
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("no consulta influx si no hay influxId", async () => {
    await addDispositivo(headers, invernaderoId);
    const { status, json } = await callRoute(GET, { headers });
    expect(status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(json.data.invernaderos[0].equipos[0].conexion).toBe("sin_influx");
  });

  it("503 si faltan las variables INFLUX_*", async () => {
    await addDispositivo(headers, invernaderoId, "0C2CC8");
    vi.unstubAllEnvs();
    const { status, json } = await callRoute(GET, { headers });
    expect(status).toBe(503);
    expect(json.code).toBe("influx_no_configurado");
  });

  it("error de red → influx_sin_conexion", async () => {
    await addDispositivo(headers, invernaderoId, "0C2CC8");
    fetchMock.mockRejectedValue(new TypeError("x"));
    const { status } = await callRoute(GET, { headers });
    expect(status).toBe(502);
  });

  it("401 sin sesión", async () => {
    const { status } = await callRoute(GET, {});
    expect(status).toBe(401);
  });

  it("no mezcla usuarios", async () => {
    const otro = await makeUser();
    const h2 = authHeaders(otro);
    const inv2 = (await makeInvernadero({ userId: otro._id, headers: h2 }))._id;
    await addDispositivo(h2, inv2);
    const { json } = await callRoute(GET, { headers });
    expect(json.data.invernaderos.map((i: { _id: string }) => i._id)).toEqual([invernaderoId]);
  });
});
