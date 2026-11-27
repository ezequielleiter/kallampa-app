import { describe, it, expect } from "vitest";
import type { EquipoResumen } from "@/lib/monitoreo/tipos";
import { estadoFigura, largoNiebla } from "./model";

const equipo = (over: Partial<EquipoResumen> = {}): EquipoResumen => ({
  dispositivoId: "d1", nombre: "Fructificación", dominio: "fungi-fructificacion.local", influxId: "d2d0e0",
  conexion: "conectado", ultimoEstado: 0, vaciandoCola: false,
  ahora: { t: 0, temperatura: 23.5, humedad: 86 },
  rangoTemp: { min: 22, max: 25 }, rangoHum: { min: 85, max: 95 },
  fueraTemp: null, fueraHum: null,
  aparatos: {
    humidificador: { on: true, potencia: 50, aprendiendo: false },
    calefaccion: { on: false, potencia: null, aprendiendo: false },
    extractor: { on: false, potencia: null, aprendiendo: false },
  },
  alarmas: [],
  tendencia: { temp: [], hum: [] },
  dia: {
    temp: null, hum: null, enRangoPct: { temp: null, hum: null },
    usoPct: { humidificador: 0, calefaccion: 0, extractor: 0 }, reinicios: 0, ultimoReset: null, fw: null, rssi: null,
  },
  ...over,
});

describe("estadoFigura", () => {
  it("sin equipo no hay ningun dato", () => {
    expect(estadoFigura(null, false)).toEqual({
      humidificador: null, extractor: null, temperatura: null, humedad: null, fueraTemp: null, fueraHum: null,
    });
  });

  it("conectado toma los aparatos y el clima del ultimo estado", () => {
    expect(estadoFigura(equipo(), false)).toEqual({
      humidificador: true, extractor: false, temperatura: 23.5, humedad: 86, fueraTemp: null, fueraHum: null,
    });
  });

  it("desconectado o sin datos no inventa aparatos prendidos", () => {
    for (const conexion of ["desconectado", "sin_datos", "sin_influx"] as const) {
      const e = estadoFigura(equipo({ conexion }), false);
      expect(e.humidificador).toBeNull();
      expect(e.extractor).toBeNull();
    }
  });

  it("si responde por la red local vale aunque Influx diga desconectado", () => {
    const e = estadoFigura(equipo({ conexion: "desconectado" }), true);
    expect(e.humidificador).toBe(true);
    expect(e.extractor).toBe(false);
  });
});

describe("largoNiebla", () => {
  it("crece lineal de 40 cm a 60 % a 90 cm a 95 %, fijo afuera", () => {
    expect(largoNiebla(60)).toBe(40);
    expect(largoNiebla(95)).toBe(90);
    expect(largoNiebla(77.5)).toBe(65);
    expect(largoNiebla(30)).toBe(40);
    expect(largoNiebla(100)).toBe(90);
    expect(largoNiebla(null)).toBe(40);
  });
});
