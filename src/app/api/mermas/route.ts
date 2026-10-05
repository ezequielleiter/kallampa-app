import type { NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import dbConnect from "@/lib/mongodb";
import Merma from "@/models/Merma";
import { ok, handleApiError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { mermaSchema } from "@/lib/validations/merma.schema";
import { validarLotesDelUsuario, validarStock } from "@/lib/ventas-server";

// GET /api/mermas?batchId= — mas nuevas primero.
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const batchId = new URL(req.url).searchParams.get("batchId");
    if (batchId && !isValidObjectId(batchId)) return ok([]);

    const filter: Record<string, unknown> = { userId };
    if (batchId) filter.batchId = batchId;
    const mermas = await Merma.find(filter).sort({ fecha: -1, createdAt: -1 }).lean();
    return ok(mermas);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const parsed = mermaSchema.parse(await req.json());

    await validarLotesDelUsuario(userId, [parsed.batchId]);
    await validarStock(userId, [{ batchId: parsed.batchId, kg: parsed.kg }]);

    const datos = Object.fromEntries(Object.entries(parsed).filter(([, v]) => v != null));
    const created = await Merma.create({ ...datos, userId });
    return ok(created.toObject(), 201);
  } catch (err) {
    return handleApiError(err);
  }
}
