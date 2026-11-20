import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Invernadero from "@/models/Invernadero";
import { ok, handleApiError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { getInfluxConfig, runFlux } from "@/lib/influx";
import {
  fluxActuadores24h,
  fluxAmbiente24h,
  fluxReinicios24h,
  fluxUltimoAmbiente,
  fluxUltimoEstado,
} from "@/lib/monitoreo/flux";
import { filasPorId, resumirEquipo } from "@/lib/monitoreo/resumen";
import { INFLUX_ID_RE, type ResumenMonitoreo } from "@/lib/monitoreo/tipos";

// 5 consultas en paralelo a InfluxDB, cada una con timeout de 15 s (ver src/lib/influx.ts).
export const maxDuration = 30;

type Fila = Record<string, string | null>;

// Resumen de todos los equipos de los invernaderos activos del usuario.
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const invernaderos = await Invernadero.find({ userId, activo: true }).sort({ nombre: 1 });

    const idDe = (v?: string | null) => {
      const id = v?.trim().toLowerCase();
      return id && INFLUX_ID_RE.test(id) ? id : null;
    };
    const ids = [
      ...new Set(invernaderos.flatMap((i) => i.dispositivos.map((d) => idDe(d.influxId))).filter((x): x is string => !!x)),
    ];

    let estado = new Map<string, Fila>();
    let ambiente = new Map<string, Fila>();
    let actuadores = new Map<string, Fila>();
    const ventanas = new Map<string, Fila[]>();
    const reinicios = new Map<string, number>();
    if (ids.length) {
      const config = getInfluxConfig();
      const q = (f: (b: string, i: string[]) => string) => runFlux(f(config.bucket, ids), config);
      const [est, amb, v24, act, rei] = await Promise.all([
        q(fluxUltimoEstado),
        q(fluxUltimoAmbiente),
        q(fluxAmbiente24h),
        q(fluxActuadores24h),
        q(fluxReinicios24h),
      ]);
      estado = filasPorId(est);
      ambiente = filasPorId(amb);
      actuadores = filasPorId(act);
      for (const r of v24) if (r.id) ventanas.set(r.id, [...(ventanas.get(r.id) ?? []), r]);
      for (const r of rei) if (r.id) reinicios.set(r.id, Number(r._value) || 0);
    }

    const now = Date.now();
    const body: ResumenMonitoreo = {
      invernaderos: invernaderos.map((inv) => ({
        _id: String(inv._id),
        nombre: inv.nombre,
        equipos: inv.dispositivos.map((d) => {
          const id = idDe(d.influxId);
          return resumirEquipo({
            dispositivo: {
              _id: String(d._id),
              nombre: d.nombre,
              influxId: id,
              tempMin: d.tempMin,
              tempMax: d.tempMax,
              humMin: d.humMin,
              humMax: d.humMax,
            },
            estado: (id && estado.get(id)) || null,
            ambiente: (id && ambiente.get(id)) || null,
            ventanas: (id && ventanas.get(id)) || [],
            actuadores: (id && actuadores.get(id)) || null,
            reinicios: (id && reinicios.get(id)) || 0,
            now,
          });
        }),
      })),
      generado: now,
    };
    return ok(body);
  } catch (err) {
    return handleApiError(err);
  }
}
