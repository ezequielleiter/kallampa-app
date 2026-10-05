import type { NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import dbConnect from "@/lib/mongodb";
import Venta from "@/models/Venta";
import { ok, handleApiError, notFound } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { cobroVentaSchema, ventaSchema } from "@/lib/validations/venta.schema";
import {
  buscarVentas,
  validarClienteDelUsuario,
  validarLotesDelUsuario,
  validarStock,
} from "@/lib/ventas-server";

const NO_ENCONTRADA = "venta_no_encontrada:Venta no encontrada";

type Ctx = { params: Promise<{ id: string }> };

async function ventaDelUsuario(userId: string, id: string) {
  if (!isValidObjectId(id)) throw notFound(NO_ENCONTRADA);
  const venta = await Venta.findOne({ _id: id, userId });
  if (!venta) throw notFound(NO_ENCONTRADA);
  return venta;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;
    if (!isValidObjectId(id)) throw notFound(NO_ENCONTRADA);

    const [venta] = await buscarVentas({ _id: id, userId });
    if (!venta) throw notFound(NO_ENCONTRADA);
    return ok(venta);
  } catch (err) {
    return handleApiError(err);
  }
}

// PATCH:
// - body { cobrada } solo => marca cobrada (fechaCobro = ahora) o pendiente
//   (borra fechaCobro).
// - body completo (mismo schema que el POST) => edita la venta; revalida
//   lotes/cliente/stock excluyendo a esta misma venta. numeroVenta no cambia.
export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const venta = await ventaDelUsuario(userId, id);

    const soloCobro =
      body && typeof body === "object" && !Array.isArray(body) &&
      Object.keys(body).length === 1 && "cobrada" in body;

    if (soloCobro) {
      const { cobrada } = cobroVentaSchema.parse(body);
      if (cobrada !== venta.cobrada) {
        venta.cobrada = cobrada;
        venta.fechaCobro = cobrada ? new Date() : undefined;
      }
    } else {
      const parsed = ventaSchema.parse(body);
      await validarLotesDelUsuario(userId, parsed.items.map((i) => i.batchId));
      if (parsed.clienteId) await validarClienteDelUsuario(userId, parsed.clienteId);
      await validarStock(userId, parsed.items, { excluirVentaId: id });

      venta.set({
        fecha: parsed.fecha,
        clienteId: parsed.clienteId ?? undefined,
        items: parsed.items,
        medioPago: parsed.medioPago,
        notas: parsed.notas ?? undefined,
      });
      if (parsed.cobrada !== venta.cobrada) {
        venta.cobrada = parsed.cobrada;
        venta.fechaCobro = parsed.cobrada ? new Date() : undefined;
      }
    }

    await venta.save();
    const [actualizada] = await buscarVentas({ _id: venta._id, userId });
    return ok(actualizada);
  } catch (err) {
    return handleApiError(err);
  }
}

// DELETE fisico: libera el stock de sus lotes.
export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { id } = await ctx.params;
    const venta = await ventaDelUsuario(userId, id);
    await venta.deleteOne();
    return ok(null);
  } catch (err) {
    return handleApiError(err);
  }
}
