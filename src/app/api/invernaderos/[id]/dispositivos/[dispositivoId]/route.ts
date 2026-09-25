import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Invernadero from "@/models/Invernadero";
import { ok, handleApiError, notFound, conflict, badRequest } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { updateDispositivoSchema } from "@/lib/validations/invernadero.schema";

type Ctx = { params: Promise<{ id: string; dispositivoId: string }> };

async function cargar(userId: string, id: string, dispositivoId: string) {
  const invernadero = await Invernadero.findOne({ _id: id, userId });
  if (!invernadero) throw notFound("invernadero_no_encontrado:Invernadero no encontrado");
  const dispositivo = invernadero.dispositivos.id(dispositivoId);
  if (!dispositivo) throw notFound("dispositivo_no_encontrado:Dispositivo no encontrado");
  return { invernadero, dispositivo };
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id, dispositivoId } = await ctx.params;
    const body = await req.json();
    const parsed = updateDispositivoSchema.parse(body);

    const { invernadero, dispositivo } = await cargar(userId, id, dispositivoId);

    if (
      parsed.nombre !== undefined &&
      invernadero.dispositivos.some(
        (d) => d.nombre === parsed.nombre && String(d._id) !== dispositivoId
      )
    ) {
      throw conflict(
        "dispositivo_nombre_en_uso:Ya hay un dispositivo con ese nombre en este invernadero"
      );
    }

    // `null` borra el campo opcional (influxId, minimas/maximas).
    for (const [k, v] of Object.entries(parsed)) {
      if (v === undefined) continue;
      dispositivo.set(k, v === null ? undefined : v);
    }
    // El rango se valida sobre el estado resultante (el PATCH puede traer
    // solo la minima o solo la maxima).
    for (const [min, max] of [
      [dispositivo.tempMin, dispositivo.tempMax],
      [dispositivo.humMin, dispositivo.humMax],
    ]) {
      if (min != null && max != null && min >= max) {
        throw badRequest("rango_min_max_invalido:La mínima tiene que ser menor que la máxima");
      }
    }
    await invernadero.save();

    return ok(invernadero);
  } catch (err) {
    return handleApiError(err);
  }
}

// Quitar el vinculo es un borrado real: el dispositivo no tiene historial.
export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id, dispositivoId } = await ctx.params;

    const { invernadero } = await cargar(userId, id, dispositivoId);
    invernadero.dispositivos.pull({ _id: dispositivoId });
    await invernadero.save();

    return ok(invernadero);
  } catch (err) {
    return handleApiError(err);
  }
}
