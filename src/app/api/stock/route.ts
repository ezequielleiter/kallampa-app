import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import "@/models/FungusType";
import { ok, handleApiError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { disponiblePorLote } from "@/lib/ventas-server";
import type { StockLote } from "@/lib/types";

// GET /api/stock — stock de producto fresco por lote (cosechado − vendido −
// merma), solo lotes que cosecharon algo. numeroLote desc.
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();

    const stock = await disponiblePorLote(userId, undefined);
    const conCosecha = [...stock.values()].filter((s) => s.cosechadoKg > 0);
    if (conCosecha.length === 0) return ok([]);

    const lotes = await Batch.find({ userId, _id: { $in: conCosecha.map((s) => s.batchId) } })
      .select("numeroLote fungusTypeId")
      .populate("fungusTypeId", "nombre")
      .lean();

    const items: StockLote[] = lotes.map((l) => {
      const s = stock.get(String(l._id))!;
      const hongo = l.fungusTypeId as unknown as { nombre?: string } | null;
      return {
        batchId: String(l._id),
        numeroLote: l.numeroLote,
        hongo: hongo?.nombre ?? "",
        cosechadoKg: s.cosechadoKg,
        vendidoKg: s.vendidoKg,
        mermaKg: s.mermaKg,
        disponibleKg: s.disponibleKg,
      };
    });
    // Se ordena por la parte L-<anio>-<seq> (sin las iniciales del hongo).
    const clave = (n: string) => n.replace(/^[A-Z]{1,4}-(?=L-)/, "");
    items.sort((a, b) =>
      clave(b.numeroLote).localeCompare(clave(a.numeroLote), undefined, { numeric: true })
    );
    return ok(items);
  } catch (err) {
    return handleApiError(err);
  }
}
