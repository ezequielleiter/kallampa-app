import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { ok, notFound, handleApiError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { updateMeSchema } from "@/lib/validations/auth.schema";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { userId } = await requireAuth(req);

    const user = await User.findById(userId);
    if (!user) throw notFound("usuario_no_encontrado:Usuario no encontrado");

    return ok({ _id: user._id, username: user.username, email: user.email, locale: user.locale });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    const { userId } = await requireAuth(req);
    const body = await req.json();
    const parsed = updateMeSchema.parse(body);

    const user = await User.findByIdAndUpdate(userId, { $set: parsed }, { new: true });
    if (!user) throw notFound("usuario_no_encontrado:Usuario no encontrado");

    return ok({ _id: user._id, username: user.username, email: user.email, locale: user.locale });
  } catch (err) {
    return handleApiError(err);
  }
}
