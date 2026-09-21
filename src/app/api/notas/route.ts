import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Nota from "@/models/Nota";
import { ok, handleApiError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { createNotaSchema } from "@/lib/validations/nota.schema";
import { extractoDeMarkdown } from "@/lib/format";

// GET /api/notas — lista ordenada por ultima edicion, con un extracto en
// texto plano del contenido (no la nota completa) para la vista de lista.
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();

    const notas = await Nota.find({ userId }).sort({ updatedAt: -1 }).lean();

    const data = notas.map((nota) => ({
      _id: nota._id,
      titulo: nota.titulo,
      updatedAt: nota.updatedAt,
      extracto: extractoDeMarkdown(nota.contenido),
    }));

    return ok(data);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const body = await req.json();
    const parsed = createNotaSchema.parse(body);

    const nota = await Nota.create({ ...parsed, userId });

    return ok(nota, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
