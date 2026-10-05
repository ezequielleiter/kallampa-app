import type { NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import dbConnect from "@/lib/mongodb";
import Venta from "@/models/Venta";
import { ok, handleApiError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { getNextNumeroVenta } from "@/lib/counters";
import { ventaSchema } from "@/lib/validations/venta.schema";
import {
  buscarVentas,
  validarClienteDelUsuario,
  validarLotesDelUsuario,
  validarStock,
} from "@/lib/ventas-server";

// GET /api/ventas?batchId=&clienteId=&cobro=pendiente|cobrada
// Mas nuevas primero, con cliente e items populados y total calculado.
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");
    const clienteId = searchParams.get("clienteId");
    const cobro = searchParams.get("cobro");

    // Un id invalido no matchea nada (en vez de un CastError -> 500).
    if ((batchId && !isValidObjectId(batchId)) || (clienteId && !isValidObjectId(clienteId))) {
      return ok([]);
    }

    const filter: Record<string, unknown> = { userId };
    if (batchId) filter["items.batchId"] = batchId;
    if (clienteId) filter.clienteId = clienteId;
    if (cobro === "pendiente") filter.cobrada = false;
    else if (cobro === "cobrada") filter.cobrada = true;

    return ok(await buscarVentas(filter));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const parsed = ventaSchema.parse(await req.json());

    await validarLotesDelUsuario(userId, parsed.items.map((i) => i.batchId));
    if (parsed.clienteId) await validarClienteDelUsuario(userId, parsed.clienteId);
    await validarStock(userId, parsed.items);

    // El correlativo sigue el anio de la fecha de la venta (fechas "solo
    // dia" a medianoche UTC).
    const numeroVenta = await getNextNumeroVenta(userId, parsed.fecha.getUTCFullYear());
    const created = await Venta.create({
      userId,
      numeroVenta,
      fecha: parsed.fecha,
      ...(parsed.clienteId ? { clienteId: parsed.clienteId } : {}),
      items: parsed.items,
      medioPago: parsed.medioPago,
      cobrada: parsed.cobrada,
      ...(parsed.cobrada ? { fechaCobro: new Date() } : {}),
      ...(parsed.notas ? { notas: parsed.notas } : {}),
    });

    const [venta] = await buscarVentas({ _id: created._id, userId });
    return ok(venta, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
