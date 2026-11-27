import type { EquipoResumen } from "@/lib/monitoreo/tipos";

/** Lo que la figura muestra del equipo. `null` = sin dato vigente: no se dibuja nada prendido. */
export interface EstadoFigura {
  humidificador: boolean | null;
  extractor: boolean | null;
  temperatura: number | null;
  humedad: number | null;
  fueraTemp: "alta" | "baja" | null;
  fueraHum: "alta" | "baja" | null;
}

/**
 * Los aparatos solo valen si el dato es vigente: el equipo respondio por la red
 * local o Influx lo ve conectado. Un "prendido" viejo no se anima.
 */
export function estadoFigura(e: EquipoResumen | null, enVivo: boolean): EstadoFigura {
  if (!e) return { humidificador: null, extractor: null, temperatura: null, humedad: null, fueraTemp: null, fueraHum: null };
  const vigente = enVivo || e.conexion === "conectado";
  return {
    humidificador: vigente ? e.aparatos.humidificador.on : null,
    extractor: vigente ? e.aparatos.extractor.on : null,
    temperatura: e.ahora.temperatura,
    humedad: e.ahora.humedad,
    fueraTemp: e.fueraTemp,
    fueraHum: e.fueraHum,
  };
}

/**
 * Cuantos cm recorre la niebla del humidificador antes de evaporarse. La niebla
 * ultrasonica es fria y cae; con el aire mas humedo tarda mas en desaparecer.
 */
export function largoNiebla(humedad: number | null): number {
  const t = Math.min(1, Math.max(0, ((humedad ?? 60) - 60) / 35));
  return 40 + t * 50;
}
