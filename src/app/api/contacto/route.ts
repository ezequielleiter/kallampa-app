import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Contacto from "@/models/Contacto";
import { ok, handleApiError } from "@/lib/api-utils";
import { contactoSchema } from "@/lib/validations/contacto.schema";

// Publico (sin cuenta): recibe las consultas del formulario de la landing.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sitio, ...datos } = contactoSchema.parse(body);

    // Campo trampa completado → bot: se responde igual que un envio valido.
    if (sitio && sitio.trim() !== "") return ok({ recibido: true }, 201);

    await dbConnect();
    await Contacto.create(datos);
    return ok({ recibido: true }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
