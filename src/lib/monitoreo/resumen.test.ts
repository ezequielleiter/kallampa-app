import { describe, it, expect } from "vitest";
import { filasPorId, resumirEquipo } from "./resumen";
import {
  fluxUltimoEstado, fluxUltimoAmbiente, fluxAmbiente24h, fluxActuadores24h, fluxReinicios24h,
} from "./flux";

const now = Date.parse("2026-11-20T12:00:00Z");
const dispositivo = { _id: "d1", nombre: "Carpa 1", dominio: "carpa1.local", influxId: "0c2cc8", tempMin: 18, tempMax: 24, humMin: 80, humMax: 90 };
const base = { dispositivo, estado: null, ambiente: null, ventanas: [], actuadores: null, reinicios: 0, now };
type F = Record<string, string | null>;
const est = (o: F): F => ({ _time: "2026-11-20T11:58:30Z", intervalo_min: "1", ...o });

describe("resumirEquipo", () => {
  it("conectado si el ultimo estado tiene <= 2 x intervalo_min", () => {
    const r = resumirEquipo({ ...base, estado: est({}) });
    expect(r.conexion).toBe("conectado");
    expect(r.ultimoEstado).toBe(Date.parse("2026-11-20T11:58:30Z"));
  });
  it("desconectado pasado 2 x intervalo_min", () => {
    const r = resumirEquipo({ ...base, estado: est({ _time: "2026-11-20T11:57:00Z" }) });
    expect(r.conexion).toBe("desconectado");
  });
  it("sin estado usa rango manual", () => {
    const r = resumirEquipo({ ...base, ambiente: { _time: "2026-11-20T11:59:00Z", temperatura: "25.2" } });
    expect(r.conexion).toBe("sin_datos");
    expect(r.rangoTemp).toEqual({ min: 18, max: 24 });
    expect(r.fueraTemp).toBe("alta");
  });
  it("el rango del equipo gana al manual", () => {
    const r = resumirEquipo({
      ...base,
      estado: est({ temp_min: "20", temp_max: "26" }),
      ambiente: { _time: "2026-11-20T11:59:00Z", temperatura: "25.2" },
    });
    expect(r.fueraTemp).toBeNull();
  });
  it("alarmas", () => {
    const r = resumirEquipo({ ...base, estado: est({ agua_vacia: "true", sensor_ok: "false", rssi: "-85" }) });
    expect(r.alarmas).toEqual(["agua_vacia", "sensor_falla", "wifi_debil"]);
  });
  it("sin agua_vacia no alarma", () => {
    const r = resumirEquipo({ ...base, estado: est({ sensor_ok: "true", rssi: "-60" }) });
    expect(r.alarmas).toEqual([]);
  });
  it("aparatos", () => {
    const r = resumirEquipo({
      ...base,
      estado: est({ hum_on: "true", hum_pot: "42.5", hum_aprendiendo: "true", calef_on: "false", ext_on: "false" }),
    });
    expect(r.aparatos.humidificador).toEqual({ on: true, potencia: 42.5, aprendiendo: true });
    expect(r.aparatos.extractor).toEqual({ on: false, potencia: null, aprendiendo: false });
  });
  it("dia", () => {
    const ventanas = [19, 22, 25, null].map((t) => ({ temperatura: t === null ? null : String(t) }));
    const r = resumirEquipo({
      ...base,
      ventanas,
      actuadores: { calefaccion_seg: "8640", humidificador_seg: "0", extractor_seg: "43200" },
      reinicios: 2,
    });
    expect(r.dia.temp).toEqual({ min: 19, max: 25, prom: 22 });
    expect(r.dia.enRangoPct.temp).toBe(66.7);
    expect(r.dia.usoPct).toEqual({ humidificador: 0, calefaccion: 10, extractor: 50 });
    expect(r.dia.reinicios).toBe(2);
  });
  it("vaciando cola", () => {
    expect(resumirEquipo({ ...base, estado: est({ pendientes: "3" }) }).vaciandoCola).toBe(true);
    expect(resumirEquipo({ ...base, estado: est({ pendientes: "1" }) }).vaciandoCola).toBe(false);
  });
  it("tendencia: 48 tramos de 30 min, promedio por tramo y null sin datos", () => {
    const iso = (msAtras: number) => new Date(now - msAtras).toISOString();
    const r = resumirEquipo({
      ...base,
      ventanas: [
        { _time: iso(10 * 60_000), temperatura: "20", humedad: "80" },
        { _time: iso(20 * 60_000), temperatura: "22", humedad: null },
        { _time: iso(23.8 * 3600_000), temperatura: "18", humedad: "90" },
        { _time: iso(25 * 3600_000), temperatura: "99", humedad: "99" },
      ],
    });
    expect(r.tendencia.temp).toHaveLength(48);
    expect(r.tendencia.temp[47]).toBe(21);
    expect(r.tendencia.hum[47]).toBe(80);
    expect(r.tendencia.temp[0]).toBe(18);
    expect(r.tendencia.temp[20]).toBeNull();
  });

  it("sin_influx", () => {
    const r = resumirEquipo({ ...base, dispositivo: { _id: "d1", nombre: "x", dominio: "x.local" } });
    expect(r.conexion).toBe("sin_influx");
    expect(r.ahora.temperatura).toBeNull();
  });
});

describe("filasPorId", () => {
  it("fusiona filas del mismo id", () => {
    const m = filasPorId([
      { id: "0c2cc8", device: "viejo", _time: "2026-11-20T10:00:00Z", temperatura: "20" },
      { id: "0c2cc8", device: "nuevo", _time: "2026-11-20T11:00:00Z", temperatura: "21", humedad: null },
    ]);
    expect(m.size).toBe(1);
    expect(m.get("0c2cc8")?.temperatura).toBe("21");
    expect(m.get("0c2cc8")?.device).toBe("nuevo");
  });
});

describe("builders", () => {
  it("validan ids", () => {
    expect(() => fluxUltimoEstado("b", ['0c2cc8")'])).toThrow();
    const q = fluxUltimoEstado("b", ["0c2cc8"]);
    expect(q).toContain('pivot(rowKey: ["_time"]');
    expect(q).not.toMatch(/group\(\)[\s\S]*pivot/);
  });
  it.each([
    ["fluxUltimoEstado", fluxUltimoEstado],
    ["fluxUltimoAmbiente", fluxUltimoAmbiente],
    ["fluxAmbiente24h", fluxAmbiente24h],
    ["fluxActuadores24h", fluxActuadores24h],
    ["fluxReinicios24h", fluxReinicios24h],
  ])("%s: valida entradas y filtra por id/rango", (_n, fn) => {
    expect(() => fn("b", ['0c2cc8")'])).toThrow();
    expect(() => fn("b", [])).toThrow();
    expect(() => fn('b"', ["0c2cc8"])).toThrow();
    const q = fn("b", ["0c2cc8"]);
    expect(q).toContain('contains(value: r.id, set: ["0c2cc8"])');
    expect(q).toContain("range(start: -24h)");
  });
  it("actuadores pivotea por _start y reinicios agrupa por id antes de difference", () => {
    expect(fluxActuadores24h("b", ["0c2cc8"])).toContain('group(columns: ["id", "_field"])');
    expect(fluxActuadores24h("b", ["0c2cc8"])).toContain('rowKey: ["id"]');
    const q = fluxReinicios24h("b", ["0c2cc8"]);
    expect(q.indexOf('group(columns: ["id"])')).toBeGreaterThan(-1);
    expect(q.indexOf('group(columns: ["id"])')).toBeLessThan(q.indexOf("difference()"));
  });
});
