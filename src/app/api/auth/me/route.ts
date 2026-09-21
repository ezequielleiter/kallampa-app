import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { ok, notFound, handleApiError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { userId } = await requireAuth(req);

    const user = await User.findById(userId);
    if (!user) throw notFound("Usuario no encontrado");

    return ok({ _id: user._id, username: user.username, email: user.email });
  } catch (err) {
    return handleApiError(err);
  }
}
