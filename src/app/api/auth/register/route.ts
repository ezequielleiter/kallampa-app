import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { ok, conflict, handleApiError } from "@/lib/api-utils";
import { registerSchema } from "@/lib/validations/auth.schema";
import { hashPassword, generateApiKey, signSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const parsed = registerSchema.parse(body);

    const username = parsed.username.toLowerCase();
    const email = parsed.email.toLowerCase();

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      throw conflict("El nombre de usuario o el email ya están en uso");
    }

    const passwordHash = await hashPassword(parsed.password);
    const apiKey = generateApiKey();
    const user = await User.create({ username, email, passwordHash, apiKey });
    const token = signSessionToken(String(user._id));

    return ok(
      {
        token,
        apiKey,
        user: { _id: user._id, username: user.username, email: user.email },
      },
      201
    );
  } catch (err) {
    return handleApiError(err);
  }
}
