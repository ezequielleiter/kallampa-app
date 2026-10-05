// Helpers de servidor para stock de producto: agregan oleadas (Recipiente),
// items vendidos (Venta) y mermas (Merma) por lote.
import { Types, isValidObjectId } from "mongoose";
import Batch from "@/models/Batch";
import Recipiente from "@/models/Recipiente";
import Venta from "@/models/Venta";
import Merma from "@/models/Merma";
import Cliente from "@/models/Cliente";
import { conflict, notFound } from "@/lib/api-utils";
import { EPSILON_KG, formatKgEsAR, stockLote, totalVenta } from "@/lib/ventas";
import type { VentaListItem } from "@/lib/types";

export interface StockLoteServer {
  batchId: string;
  cosechadoKg: number;
  vendidoKg: number;
  mermaKg: number;
  disponibleKg: number;
  ingresos: number;
}

interface Opciones {
  excluirVentaId?: string;
  excluirMermaId?: string;
}

/**
 * Stock por lote para `batchIds` (o TODOS los lotes del usuario con
 * actividad si `batchIds` es undefined). Excluye opcionalmente una venta
 * o una merma (para validar la edicion de esa misma venta/merma).
 * Tambien devuelve los ingresos (Σ kg × precioPorKg vendidos) por lote.
 */
export async function disponiblePorLote(
  userId: string,
  batchIds: string[] | undefined,
  opts: Opciones = {}
): Promise<Map<string, StockLoteServer>> {
  const uid = new Types.ObjectId(userId);
  const ids = batchIds?.map((id) => new Types.ObjectId(id));
  const filtroLote = ids ? { batchId: { $in: ids } } : {};

  const [cosechas, ventas, mermas] = await Promise.all([
    Recipiente.aggregate<{ _id: Types.ObjectId; kg: number }>([
      { $match: { userId: uid, ...filtroLote } },
      { $unwind: "$oleadas" },
      { $group: { _id: "$batchId", kg: { $sum: "$oleadas.pesoKg" } } },
    ]),
    Venta.aggregate<{ _id: Types.ObjectId; kg: number; ingresos: number }>([
      {
        $match: {
          userId: uid,
          ...(ids ? { "items.batchId": { $in: ids } } : {}),
          ...(opts.excluirVentaId ? { _id: { $ne: new Types.ObjectId(opts.excluirVentaId) } } : {}),
        },
      },
      { $unwind: "$items" },
      ...(ids ? [{ $match: { "items.batchId": { $in: ids } } }] : []),
      {
        $group: {
          _id: "$items.batchId",
          kg: { $sum: "$items.kg" },
          ingresos: { $sum: { $multiply: ["$items.kg", "$items.precioPorKg"] } },
        },
      },
    ]),
    Merma.aggregate<{ _id: Types.ObjectId; kg: number }>([
      {
        $match: {
          userId: uid,
          ...filtroLote,
          ...(opts.excluirMermaId ? { _id: { $ne: new Types.ObjectId(opts.excluirMermaId) } } : {}),
        },
      },
      { $group: { _id: "$batchId", kg: { $sum: "$kg" } } },
    ]),
  ]);

  const acc = new Map<string, { cosechadoKg: number; vendidoKg: number; mermaKg: number; ingresos: number }>();
  const get = (id: string) => {
    let v = acc.get(id);
    if (!v) {
      v = { cosechadoKg: 0, vendidoKg: 0, mermaKg: 0, ingresos: 0 };
      acc.set(id, v);
    }
    return v;
  };
  for (const id of batchIds ?? []) get(id);
  for (const c of cosechas) get(String(c._id)).cosechadoKg += c.kg;
  for (const v of ventas) {
    const e = get(String(v._id));
    e.vendidoKg += v.kg;
    e.ingresos += v.ingresos;
  }
  for (const m of mermas) get(String(m._id)).mermaKg += m.kg;

  const out = new Map<string, StockLoteServer>();
  for (const [batchId, v] of acc) {
    out.set(batchId, { batchId, ...stockLote(v), ingresos: v.ingresos });
  }
  return out;
}

/**
 * Tira 409 `stock_insuficiente` si algun pedido supera lo disponible del
 * lote (calculado excluyendo la venta/merma que se esta editando).
 */
export async function validarStock(
  userId: string,
  pedidos: { batchId: string; kg: number }[],
  opts: Opciones = {}
): Promise<void> {
  const stock = await disponiblePorLote(
    userId,
    pedidos.map((p) => p.batchId),
    opts
  );
  const faltantes = pedidos.filter(
    (p) => p.kg > (stock.get(p.batchId)?.disponibleKg ?? 0) + EPSILON_KG
  );
  if (faltantes.length === 0) return;

  const p = faltantes[0];
  const lote = await Batch.findOne({ _id: p.batchId, userId }).select("numeroLote").lean();
  const disponible = Math.max(0, stock.get(p.batchId)?.disponibleKg ?? 0);
  throw conflict(
    `stock_insuficiente:El lote ${lote?.numeroLote ?? ""} tiene ${formatKgEsAR(disponible)} kg disponibles`
  );
}

export const LOTE_NO_ENCONTRADO = "lote_no_encontrado:Lote no encontrado";
export const CLIENTE_NO_ENCONTRADO = "cliente_no_encontrado:Cliente no encontrado";

/** 404 si algun lote no existe o no es del usuario. */
export async function validarLotesDelUsuario(userId: string, batchIds: string[]) {
  const unicos = [...new Set(batchIds)];
  if (unicos.some((id) => !isValidObjectId(id))) throw notFound(LOTE_NO_ENCONTRADO);
  const n = await Batch.countDocuments({ _id: { $in: unicos }, userId });
  if (n !== unicos.length) throw notFound(LOTE_NO_ENCONTRADO);
}

/** 404 si el cliente no existe o no es del usuario. */
export async function validarClienteDelUsuario(userId: string, clienteId: string) {
  if (!isValidObjectId(clienteId) || !(await Cliente.exists({ _id: clienteId, userId }))) {
    throw notFound(CLIENTE_NO_ENCONTRADO);
  }
}

/**
 * Busca ventas (ya filtradas por `filter`, que debe incluir userId) con
 * cliente e items populados y el total calculado. Mas nuevas primero.
 */
export async function buscarVentas(filter: Record<string, unknown>): Promise<VentaListItem[]> {
  const ventas = await Venta.find(filter)
    .sort({ fecha: -1, createdAt: -1 })
    .populate("clienteId", "nombre")
    .populate("items.batchId", "numeroLote")
    .lean();
  return ventas.map((v) => {
    const venta = v as unknown as VentaListItem;
    return { ...venta, clienteId: venta.clienteId ?? null, total: totalVenta(venta.items) };
  });
}
