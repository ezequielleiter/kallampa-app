// Agregados de compras por cliente (total comprado, cantidad de ventas,
// saldo pendiente de cobro), calculados sobre la coleccion de ventas.
import { Types } from "mongoose";
import Venta from "@/models/Venta";

export interface AgregadoCliente {
  totalComprado: number;
  cantidadVentas: number;
  saldoPendiente: number;
}

const VACIO: AgregadoCliente = { totalComprado: 0, cantidadVentas: 0, saldoPendiente: 0 };
const redondear = (v: number) => Math.round(v * 100) / 100;

export async function agregadosPorCliente(
  userId: string,
  clienteIds?: Types.ObjectId[]
): Promise<Map<string, AgregadoCliente>> {
  const rows = await Venta.aggregate<{
    _id: Types.ObjectId;
    totalComprado: number;
    cantidadVentas: number;
    saldoPendiente: number;
  }>([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        clienteId: clienteIds ? { $in: clienteIds } : { $ne: null },
      },
    },
    {
      $project: {
        clienteId: 1,
        cobrada: 1,
        total: {
          $sum: {
            $map: { input: "$items", as: "i", in: { $multiply: ["$$i.kg", "$$i.precioPorKg"] } },
          },
        },
      },
    },
    {
      $group: {
        _id: "$clienteId",
        totalComprado: { $sum: "$total" },
        cantidadVentas: { $sum: 1 },
        saldoPendiente: { $sum: { $cond: ["$cobrada", 0, "$total"] } },
      },
    },
  ]);
  return new Map(
    rows.map((r) => [
      String(r._id),
      {
        totalComprado: redondear(r.totalComprado),
        cantidadVentas: r.cantidadVentas,
        saldoPendiente: redondear(r.saldoPendiente),
      },
    ])
  );
}

/** Le agrega los agregados de compras a uno o mas clientes (lean). */
export async function conAgregados<T extends { _id: unknown }>(
  userId: string,
  clientes: T[]
): Promise<(T & AgregadoCliente)[]> {
  if (clientes.length === 0) return [];
  const map = await agregadosPorCliente(
    userId,
    clientes.map((c) => c._id as Types.ObjectId)
  );
  return clientes.map((c) => ({ ...c, ...(map.get(String(c._id)) ?? VACIO) }));
}
