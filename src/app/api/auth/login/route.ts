import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { ok, unauthorized, handleApiError } from "@/lib/api-utils";
import { loginSchema } from "@/lib/validations/auth.schema";
import { verifyPassword, signSessionToken } from "@/lib/auth";

const INVALID_CREDENTIALS_MESSAGE = "Usuario/email o contraseña incorrectos";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const parsed = loginSchema.parse(body);

    const identificador = parsed.identificador.toLowerCase();
    const user = await User.findOne({
      $or: [{ username: identificador }, { email: identificador }],
    }).select("+passwordHash +apiKey");

    if (!user) throw unauthorized(INVALID_CREDENTIALS_MESSAGE);

    const valid = await verifyPassword(parsed.password, user.passwordHash);
    if (!valid) throw unauthorized(INVALID_CREDENTIALS_MESSAGE);

    const token = signSessionToken(String(user._id));

    return ok({
      token,
      apiKey: user.apiKey,
      user: { _id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
