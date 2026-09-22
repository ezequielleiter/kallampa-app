import type { NextRequest } from "next/server";
import type { Model, Document } from "mongoose";
import dbConnect from "@/lib/mongodb";
import { ok, fail, handleApiError, notFound } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import {
  catalogCreateSchema,
  catalogUpdateSchema,
} from "@/lib/validations/catalog.schema";

/**
 * Handlers genericos reutilizados por los catalogos "simples"
 * (GrainType, SubstrateType) que comparten exactamente la forma
 * { nombre, notas?, activo }. FungusType tiene su propio route handler
 * porque su schema es distinto (dias esperados por defecto).
 */

interface CatalogDoc extends Document {
  nombre: string;
  notas?: string;
  activo: boolean;
}

export function makeCatalogListCreateHandlers<T extends CatalogDoc>(
  model: Model<T>
) {
  async function GET(req: NextRequest) {
    try {
      const { userId } = await requireAuth(req);
      await dbConnect();
      const { searchParams } = new URL(req.url);
      const activoParam = searchParams.get("activo");

      const filter: Record<string, unknown> = { userId };
      if (activoParam !== null) {
        filter.activo = activoParam === "true";
      }

      const items = await model.find(filter).sort({ nombre: 1 }).lean();
      return ok(items);
    } catch (err) {
      return handleApiError(err);
    }
  }

  async function POST(req: NextRequest) {
    try {
      const { userId } = await requireAuth(req);
      await dbConnect();
      const body = await req.json();
      const parsed = catalogCreateSchema.parse(body);

      const existing = await model.findOne({ userId, nombre: parsed.nombre });
      if (existing) {
        return fail("registro_nombre_en_uso:Ya existe un registro con ese nombre", 409);
      }

      const created = await model.create({ ...parsed, userId } as unknown as Partial<T>);
      return ok(created, 201);
    } catch (err) {
      return handleApiError(err);
    }
  }

  return { GET, POST };
}

export function makeCatalogItemHandlers<T extends CatalogDoc>(
  model: Model<T>
) {
  async function PATCH(
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
  ) {
    try {
      const { userId } = await requireAuth(req);
      await dbConnect();
      const { id } = await ctx.params;
      const body = await req.json();
      const parsed = catalogUpdateSchema.parse(body);

      const updated = await model.findOneAndUpdate(
        { _id: id, userId },
        { $set: parsed },
        { new: true, runValidators: true }
      );

      if (!updated) throw notFound("registro_no_encontrado:Registro no encontrado");

      return ok(updated);
    } catch (err) {
      return handleApiError(err);
    }
  }

  return { PATCH };
}
