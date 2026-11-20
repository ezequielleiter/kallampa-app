// Resumen puro por equipo a partir de filas CSV de Influx (sin Node, usable en cliente).
import type { Aparato, Alarma, EquipoResumen, RangoObjetivo, Stats } from "./tipos";

type Fila = Record<string, string | null>;

const num = (v: string | null | undefined): number | null => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const bool = (v: string | null | undefined): boolean | null =>
  v === "true" ? true : v === "false" ? false : null;
const r1 = (n: number) => Math.round(n * 10) / 10;
const ms = (v: string | null | undefined) => {
  const t = v ? Date.parse(v) : NaN;
  return Number.isFinite(t) ? t : null;
};

/** Fusiona filas por id; por campo gana la fila con el _time mas reciente (un valor null no pisa). */
export function filasPorId(filas: Fila[]): Map<string, Fila> {
  const out = new Map<string, Fila>();
  const tiempos = new Map<string, Map<string, number>>(); // id -> campo -> t
  for (const f of filas) {
    if (!f.id) continue;
    const t = ms(f._time) ?? 0;
    const acc = out.get(f.id) ?? {};
    const ts = tiempos.get(f.id) ?? new Map<string, number>();
    for (const [k, v] of Object.entries(f)) {
      if (v == null) continue;
      if (t >= (ts.get(k) ?? -Infinity)) {
        acc[k] = v;
        ts.set(k, t);
      }
    }
    out.set(f.id, acc);
    tiempos.set(f.id, ts);
  }
  return out;
}

function fuera(v: number | null, r: RangoObjetivo): "alta" | "baja" | null {
  if (v == null) return null;
  if (r.max != null && v > r.max) return "alta";
  if (r.min != null && v < r.min) return "baja";
  return null;
}

function stats(vals: number[]): Stats | null {
  if (!vals.length) return null;
  return { min: Math.min(...vals), max: Math.max(...vals), prom: vals.reduce((a, b) => a + b, 0) / vals.length };
}

function enRango(vals: number[], r: RangoObjetivo): number | null {
  if (r.min == null || r.max == null || !vals.length) return null;
  return r1((vals.filter((v) => v >= r.min! && v <= r.max!).length / vals.length) * 100);
}

export function resumirEquipo(input: {
  dispositivo: {
    _id: string; nombre: string; influxId?: string | null;
    tempMin?: number; tempMax?: number; humMin?: number; humMax?: number;
  };
  estado: Fila | null; ambiente: Fila | null; ventanas: Fila[];
  actuadores: Fila | null; reinicios: number; now: number;
}): EquipoResumen {
  const { dispositivo: d, estado, ambiente, ventanas, actuadores, reinicios, now } = input;
  const influxId = d.influxId ?? null;
  const e: Fila = estado ?? {};
  const rango = (min: string, max: string, man: [number | undefined, number | undefined]): RangoObjetivo => ({
    min: num(e[min]) ?? man[0] ?? null,
    max: num(e[max]) ?? man[1] ?? null,
  });
  const rangoTemp = rango("temp_min", "temp_max", [d.tempMin, d.tempMax]);
  const rangoHum = rango("hum_min", "hum_max", [d.humMin, d.humMax]);

  const ultimoEstado = ms(e._time);
  let conexion: EquipoResumen["conexion"] = "sin_datos";
  if (!influxId) conexion = "sin_influx";
  else if (estado && ultimoEstado != null) {
    const iv = num(e.intervalo_min);
    const intervaloMin = iv != null && iv > 0 ? iv : 1;
    conexion = now - ultimoEstado <= 2 * intervaloMin * 60_000 ? "conectado" : "desconectado";
  }

  const temperatura = influxId ? num(ambiente?.temperatura) : null;
  const humedad = influxId ? num(ambiente?.humedad) : null;

  const aparato = (p: string, pot: boolean): Aparato => ({
    on: bool(e[`${p}_on`]),
    potencia: pot ? num(e[`${p}_pot`]) : null,
    aprendiendo: pot && bool(e[`${p}_aprendiendo`]) === true,
  });

  const rssi = num(e.rssi);
  const alarmas: Alarma[] = [];
  if (bool(e.agua_vacia) === true) alarmas.push("agua_vacia");
  if (bool(e.sensor_ok) === false) alarmas.push("sensor_falla");
  if (rssi != null && rssi < -80) alarmas.push("wifi_debil");

  const col = (k: string) => ventanas.map((v) => num(v[k])).filter((n): n is number => n != null);
  const temps = col("temperatura");
  const hums = col("humedad");
  const uso = (k: string) => r1(((num(actuadores?.[k]) ?? 0) / 86400) * 100);

  return {
    dispositivoId: d._id, nombre: d.nombre, influxId, conexion, ultimoEstado,
    vaciandoCola: (num(e.pendientes) ?? 0) > 0,
    ahora: { t: influxId ? ms(ambiente?._time) : null, temperatura, humedad },
    rangoTemp, rangoHum,
    fueraTemp: fuera(temperatura, rangoTemp), fueraHum: fuera(humedad, rangoHum),
    aparatos: { humidificador: aparato("hum", true), calefaccion: aparato("calef", true), extractor: aparato("ext", false) },
    alarmas,
    dia: {
      temp: stats(temps), hum: stats(hums),
      enRangoPct: { temp: enRango(temps, rangoTemp), hum: enRango(hums, rangoHum) },
      usoPct: { humidificador: uso("humidificador_seg"), calefaccion: uso("calefaccion_seg"), extractor: uso("extractor_seg") },
      reinicios, ultimoReset: e.reset ?? null, fw: e.fw ?? null, rssi,
    },
  };
}
