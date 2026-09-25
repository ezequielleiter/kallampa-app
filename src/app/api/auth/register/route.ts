import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { ok, conflict, forbidden, handleApiError } from "@/lib/api-utils";
import { registerSchema } from "@/lib/validations/auth.schema";
import { hashPassword, generateApiKey, signSessionToken } from "@/lib/auth";
import { registroHabilitado } from "@/lib/registro";

// Publico: la pantalla de registro/login pregunta si se pueden crear cuentas.
export async function GET() {
  return ok({ habilitado: registroHabilitado() });
}

export async function POST(req: NextRequest) {
  try {
    if (!registroHabilitado()) {
      throw forbidden("registro_cerrado:El registro de cuentas nuevas está cerrado");
    }
    await dbConnect();
    const body = await req.json();
    const parsed = registerSchema.parse(body);

    const username = parsed.username.toLowerCase();
    const email = parsed.email.toLowerCase();

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      throw conflict("usuario_email_en_uso:El nombre de usuario o el email ya están en uso");
    }

    const passwordHash = await hashPassword(parsed.password);
    const apiKey = generateApiKey();
    const user = await User.create({ username, email, passwordHash, apiKey });
    const token = signSessionToken(String(user._id));

    return ok(
      {
        token,
        apiKey,
        user: { _id: user._id, username: user.username, email: user.email, locale: user.locale },
      },
      201
    );
  } catch (err) {
    return handleApiError(err);
  }
}
