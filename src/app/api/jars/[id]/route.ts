import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Jar from "@/models/Jar";
import { ok, handleApiError, notFound } from "@/lib/api-utils";
import { updateJarStateSchema } from "@/lib/validations/jar.schema";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = updateJarStateSchema.parse(body);

    const updated = await Jar.findByIdAndUpdate(
      id,
      { $set: { estado: parsed.estado } },
      { new: true, runValidators: true }
    );

    if (!updated) throw notFound("Frasco no encontrado");

    return ok(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
