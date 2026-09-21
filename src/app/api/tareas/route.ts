import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tarea from "@/models/Tarea";
import { ok, handleApiError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { createTareaSchema } from "@/lib/validations/tarea.schema";

// GET /api/tareas — lista ordenada por fecha. Con ?year=&month= (month
// 1-12) filtra al mes calendario correspondiente ([desde, hasta) en UTC).
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    const filter: Record<string, unknown> = { userId };
    if (year && month) {
      const y = Number(year);
      const m = Number(month);
      filter.fecha = {
        $gte: new Date(Date.UTC(y, m - 1, 1)),
        $lt: new Date(Date.UTC(y, m, 1)),
      };
    }

    const tareas = await Tarea.find(filter).sort({ fecha: 1 }).lean();

    return ok(tareas);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const body = await req.json();
    const parsed = createTareaSchema.parse(body);

    const tarea = await Tarea.create({ ...parsed, userId });

    return ok(tarea, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
