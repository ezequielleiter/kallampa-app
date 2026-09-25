import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Invernadero from "@/models/Invernadero";
import { ok, handleApiError, notFound, conflict, badRequest } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { getInfluxConfig, runFlux } from "@/lib/influx";
import { camposSerie, fluxMuestras, fluxSerie, intervaloMuestreoSeg } from "@/lib/monitoreo/flux";
import {
  RANGOS,
  RANGO_SEG,
  TIPOS_SERIE,
  VENTANA_SEG,
  type Rango,
  type SerieResponse,
  type SerieRow,
  type TipoSerie,
} from "@/lib/monitoreo/tipos";

type Ctx = { params: Promise<{ id: string; dispositivoId: string }> };

function num(v: string | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Serie agregada de un dispositivo (temperatura + calefaccion, o humedad +
// humidificador) leida de InfluxDB del lado del servidor.
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { userId } = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") ?? "24h") as Rango;
    const tipo = (searchParams.get("tipo") ?? "calefaccion") as TipoSerie;
    if (!RANGOS.includes(range)) throw badRequest("rango_invalido:Rango inválido");
    if (!TIPOS_SERIE.includes(tipo)) throw badRequest("tipo_serie_invalido:Tipo de serie inválido");

    await dbConnect();
    const { id, dispositivoId } = await ctx.params;
    const invernadero = await Invernadero.findOne({ _id: id, userId });
    if (!invernadero) throw notFound("invernadero_no_encontrado:Invernadero no encontrado");
    const dispositivo = invernadero.dispositivos.id(dispositivoId);
    if (!dispositivo) throw notFound("dispositivo_no_encontrado:Dispositivo no encontrado");
    if (!dispositivo.influxId) {
      throw conflict("dispositivo_sin_influx:El dispositivo no tiene un ID de InfluxDB asociado");
    }

    const config = getInfluxConfig();
    const influxId = dispositivo.influxId;

    // Ventana: la del rango, salvo que el equipo muestree mas espaciado.
    const muestras = await runFlux(
      fluxMuestras({ bucket: config.bucket, id: influxId, range }),
      config
    );
    const muestreo = intervaloMuestreoSeg(
      muestras.flatMap((r) => (r._time ? [Date.parse(r._time)] : [])).filter(Number.isFinite)
    );
    const windowSec = Math.max(VENTANA_SEG[range], muestreo ?? 0);

    const { valor, on } = camposSerie(tipo);
    const filas = await runFlux(
      fluxSerie({ bucket: config.bucket, id: influxId, range, windowSec, tipo }),
      config
    );
    const rows: SerieRow[] = filas
      .flatMap((r) => {
        const t = r._time ? Date.parse(r._time) : NaN;
        if (!Number.isFinite(t)) return [];
        return [{ t, valor: num(r[valor]), onSeg: Math.max(0, num(r[on]) ?? 0) }];
      })
      .sort((a, b) => a.t - b.t);

    const hasta = Date.now();
    const body: SerieResponse = {
      rows,
      windowSec,
      range,
      desde: hasta - RANGO_SEG[range] * 1000,
      hasta,
    };
    return ok(body);
  } catch (err) {
    return handleApiError(err);
  }
}
