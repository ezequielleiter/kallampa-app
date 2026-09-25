import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Invernadero from "@/models/Invernadero";
import { ok, handleApiError, notFound, conflict } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { dispositivoSchema } from "@/lib/validations/invernadero.schema";

// Asocia un dispositivo de monitoreo (nombre + dominio en la red local) al
// invernadero. La app no se comunica con el dispositivo: solo guarda el
// vinculo para abrir su pagina.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = dispositivoSchema.parse(body);

    const invernadero = await Invernadero.findOne({ _id: id, userId });
    if (!invernadero) throw notFound("invernadero_no_encontrado:Invernadero no encontrado");

    if (invernadero.dispositivos.some((d) => d.nombre === parsed.nombre)) {
      throw conflict(
        "dispositivo_nombre_en_uso:Ya hay un dispositivo con ese nombre en este invernadero"
      );
    }

    invernadero.dispositivos.push(parsed);
    await invernadero.save();

    return ok(invernadero, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
