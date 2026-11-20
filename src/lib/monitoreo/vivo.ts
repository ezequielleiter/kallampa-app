import { fuera } from "./resumen";
import type { Alarma, EquipoResumen } from "./tipos";

/** Lo que devuelve `GET http://<equipo>/sensors` (firmware propio, cada 2,5 s), ya validado. */
export interface SensorsVivo {
  temperature: number | null;
  humidity: number | null;
  ok: boolean;
  retrying: boolean;
  humidifier: boolean;
  heater: boolean;
  extractor: boolean;
  humPower: number | null;
  heatPower: number | null;
  heatMode: string | null;
  /** null = flotante desactivado; "ok"/true = hay agua; false u otro texto = vacio. */
  water: boolean | string | null;
  extractorPaused: boolean;
  extractorWaitingHum: boolean;
  /** Segundos hasta que el extractor cambie de estado. */
  extractorRemaining: number | null;
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const bool = (v: unknown) => v === true;

/** Valida la respuesta del equipo; null si no tiene la forma esperada (se trata como falla). */
export function parseSensors(json: unknown): SensorsVivo | null {
  if (json == null || typeof json !== "object" || Array.isArray(json)) return null;
  const o = json as Record<string, unknown>;
  for (const k of ["ok", "humidifier", "heater", "extractor"]) if (typeof o[k] !== "boolean") return null;
  // Lectura: numero o null (sensor sin lectura); cualquier otro tipo es una respuesta rota.
  for (const k of ["temperature", "humidity"]) if (o[k] != null && num(o[k]) == null) return null;
  const water = o.water;
  return {
    temperature: num(o.temperature),
    humidity: num(o.humidity),
    ok: o.ok as boolean,
    retrying: bool(o.retrying),
    humidifier: o.humidifier as boolean,
    heater: o.heater as boolean,
    extractor: o.extractor as boolean,
    humPower: num(o.humPower),
    heatPower: num(o.heatPower),
    heatMode: typeof o.heatMode === "string" ? o.heatMode : null,
    water: typeof water === "boolean" || typeof water === "string" ? water : null,
    extractorPaused: bool(o.extractorPaused),
    extractorWaitingHum: bool(o.extractorWaitingHum),
    extractorRemaining: num(o.extractorRemaining),
  };
}

/** `dominio` del dispositivo (host o IP, con puerto/ruta/esquema opcionales) → URL de /sensors. */
export function urlSensors(dominio: string): string | null {
  const host = dominio.trim().replace(/^https?:\/\//i, "").split("/")[0];
  return host ? `http://${host}/sensors` : null;
}

const aguaVacia = (w: SensorsVivo["water"]) => w === false || (typeof w === "string" && w !== "ok");

/** El equipo con los datos "ahora" pisados por el vivo; graficas, rangos y datos de 24 h quedan de Influx. */
export function aplicarVivo(e: EquipoResumen, s: SensorsVivo): EquipoResumen {
  const alarmas: Alarma[] = e.alarmas.filter((a) => a !== "sensor_falla" && a !== "agua_vacia");
  if (s.retrying || !s.ok) alarmas.unshift("sensor_falla");
  if (aguaVacia(s.water)) alarmas.unshift("agua_vacia");
  return {
    ...e,
    // Responder es el latido instantaneo; "sin_influx" se conserva (no hay historial que mostrar).
    conexion: e.conexion === "sin_influx" ? "sin_influx" : "conectado",
    ahora: { t: e.ahora.t, temperatura: s.temperature, humedad: s.humidity },
    fueraTemp: fuera(s.temperature, e.rangoTemp),
    fueraHum: fuera(s.humidity, e.rangoHum),
    aparatos: {
      humidificador: { on: s.humidifier, potencia: s.humPower, aprendiendo: e.aparatos.humidificador.aprendiendo },
      calefaccion: { on: s.heater, potencia: s.heatPower, aprendiendo: s.heatMode === "learning" },
      extractor: { on: s.extractor, potencia: null, aprendiendo: false },
    },
    alarmas,
  };
}
