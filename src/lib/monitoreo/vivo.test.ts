import { describe, it, expect } from "vitest";
import { aplicarVivo, parseSensors, urlSensors, type SensorsVivo } from "./vivo";
import type { EquipoResumen } from "./tipos";

const FRUCT = {
  temperature: 23.3, humidity: 85.9, ok: true, retrying: false, humidifier: false, humMode: "model",
  humPower: 18, humLearnWindows: 106, heater: false, heatMode: "learning", heatPower: null, heatLearnCycle: 0,
  extractor: false, extractorPaused: false, extractorWaitingHum: false, water: "ok",
  extractorRemaining: 200, extractorRemainingMs: 199371,
};

const equipo = (over: Partial<EquipoResumen> = {}): EquipoResumen => ({
  dispositivoId: "d1", nombre: "Colonización", dominio: "fungi-colonizacion.local", influxId: "0c2cc8",
  conexion: "conectado", ultimoEstado: 0, vaciandoCola: false,
  ahora: { t: 0, temperatura: 27, humedad: 80 },
  rangoTemp: { min: 27, max: 28 }, rangoHum: { min: 85, max: 95 },
  fueraTemp: null, fueraHum: "baja",
  aparatos: {
    humidificador: { on: true, potencia: 50, aprendiendo: true },
    calefaccion: { on: false, potencia: 10, aprendiendo: false },
    extractor: { on: false, potencia: null, aprendiendo: false },
  },
  alarmas: ["wifi_debil"],
  tendencia: { temp: [], hum: [] },
  dia: {
    temp: null, hum: null, enRangoPct: { temp: null, hum: null },
    usoPct: { humidificador: 0, calefaccion: 0, extractor: 0 }, reinicios: 0, ultimoReset: null, fw: null, rssi: -85,
  },
  ...over,
});

const vivo = (over: Partial<SensorsVivo> = {}): SensorsVivo => ({ ...parseSensors(FRUCT)!, ...over });

describe("urlSensors", () => {
  it("arma http://host[:puerto]/sensors", () => {
    expect(urlSensors("fungi-colonizacion.local")).toBe("http://fungi-colonizacion.local/sensors");
    expect(urlSensors("http://192.168.1.202/")).toBe("http://192.168.1.202/sensors");
    expect(urlSensors("sensor.local:8080/panel")).toBe("http://sensor.local:8080/sensors");
    expect(urlSensors("  ")).toBeNull();
  });
});

describe("parseSensors", () => {
  it("acepta el JSON real del equipo", () => {
    const s = parseSensors(FRUCT);
    expect(s).toMatchObject({ temperature: 23.3, humidity: 85.9, humPower: 18, heatPower: null, water: "ok", extractorRemaining: 200, heatMode: "learning" });
  });
  it("rechaza formas inesperadas", () => {
    expect(parseSensors("<html>")).toBeNull();
    expect(parseSensors({})).toBeNull();
    expect(parseSensors({ ...FRUCT, ok: "si" })).toBeNull();
    expect(parseSensors(null)).toBeNull();
  });
  it("lectura con tipo invalido es falla; null (sensor sin lectura) se acepta", () => {
    expect(parseSensors({ ...FRUCT, temperature: "x" })).toBeNull();
    expect(parseSensors({ ...FRUCT, humidity: "23.4" })).toBeNull();
    expect(parseSensors({ ...FRUCT, ok: false, temperature: null, humidity: null })!.temperature).toBeNull();
  });
});

describe("aplicarVivo", () => {
  it("pisa lectura y recalcula fuera de rango", () => {
    const r = aplicarVivo(equipo(), vivo({ temperature: 27.4, humidity: 38.2 }));
    expect(r.ahora.temperatura).toBe(27.4);
    expect(r.ahora.humedad).toBe(38.2);
    expect(r.fueraHum).toBe("baja");
    expect(r.fueraTemp).toBeNull();
    expect(aplicarVivo(equipo(), vivo({ humidity: 90 })).fueraHum).toBeNull();
  });
  it("aparatos desde el vivo; aprendiendo de calefaccion por heatMode", () => {
    const r = aplicarVivo(equipo(), vivo({ heater: true, heatPower: 27 }));
    expect(r.aparatos.calefaccion).toEqual({ on: true, potencia: 27, aprendiendo: true });
    expect(r.aparatos.humidificador).toEqual({ on: false, potencia: 18, aprendiendo: true });
    expect(r.aparatos.extractor.on).toBe(false);
    expect(aplicarVivo(equipo(), vivo({ heatMode: "pi" })).aparatos.calefaccion.aprendiendo).toBe(false);
  });
  it("alarmas en vivo", () => {
    expect(aplicarVivo(equipo(), vivo({ retrying: true })).alarmas).toContain("sensor_falla");
    expect(aplicarVivo(equipo(), vivo({ ok: false })).alarmas).toContain("sensor_falla");
    expect(aplicarVivo(equipo(), vivo({ water: "ok" })).alarmas).not.toContain("agua_vacia");
    expect(aplicarVivo(equipo(), vivo({ water: null })).alarmas).not.toContain("agua_vacia");
    expect(aplicarVivo(equipo(), vivo({ water: false })).alarmas).toContain("agua_vacia");
    expect(aplicarVivo(equipo(), vivo({ water: "vacio" })).alarmas).toContain("agua_vacia");
    // Las de Influx que el vivo reemplaza se recalculan; wifi_debil se conserva; sin duplicados.
    const r = aplicarVivo(equipo({ alarmas: ["agua_vacia", "sensor_falla", "wifi_debil"] }), vivo({ retrying: true }));
    expect(r.alarmas.sort()).toEqual(["sensor_falla", "wifi_debil"]);
  });
  it("si el equipo responde, cuenta como conectado (salvo sin_influx)", () => {
    expect(aplicarVivo(equipo({ conexion: "desconectado" }), vivo()).conexion).toBe("conectado");
    expect(aplicarVivo(equipo({ conexion: "sin_datos" }), vivo()).conexion).toBe("conectado");
    expect(aplicarVivo(equipo({ conexion: "sin_influx" }), vivo()).conexion).toBe("sin_influx");
  });

  it("sin influx ni rangos igual muestra la lectura", () => {
    const r = aplicarVivo(
      equipo({ influxId: null, conexion: "sin_influx", rangoTemp: { min: null, max: null }, rangoHum: { min: null, max: null } }),
      vivo()
    );
    expect(r.ahora.temperatura).toBe(23.3);
    expect(r.fueraTemp).toBeNull();
  });
});
