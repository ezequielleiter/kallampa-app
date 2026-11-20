import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import Jar from "@/models/Jar";
import Recipiente from "@/models/Recipiente";
import { ok, handleApiError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { resumenLote, type LeanBatch, type LeanJar, type LeanRecipiente } from "@/lib/metrics";
import type { GestionResumen } from "@/lib/types";

const DIA_MS = 24 * 60 * 60 * 1000;

// Inventario vivo (frascos y recipientes por estado) y lotes en progreso del usuario.
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const desde = new Date(Date.now() - 30 * DIA_MS);

    const [batches, jars, recipientes] = await Promise.all([
      // shortcut: carga todos los frascos/recipientes del usuario cada 60 s, pasar a $group por estado si crece el volumen
      Batch.find({ userId }).populate("fungusTypeId", "nombre").lean(),
      Jar.find({ userId }).lean(),
      Recipiente.find({ userId }).lean(),
    ]);

    const contar = (items: { estado: string }[], estado: string) =>
      items.filter((i) => i.estado === estado).length;
    const contaminados30d = (items: { estado: string; updatedAt?: Date }[]) =>
      items.filter((i) => i.estado === "contaminado" && i.updatedAt && i.updatedAt >= desde).length;

    const agrupar = <T extends { batchId: unknown }>(items: T[]) => {
      const m = new Map<string, T[]>();
      for (const i of items) {
        const k = String(i.batchId);
        m.set(k, [...(m.get(k) ?? []), i]);
      }
      return m;
    };
    const jarsPorLote = agrupar(jars as unknown as (LeanJar & { batchId: unknown })[]);
    const recsPorLote = agrupar(recipientes as unknown as (LeanRecipiente & { batchId: unknown })[]);

    const lotesActivos = (batches as unknown as (LeanBatch & { _id: unknown; numeroLote: string; fungusTypeId?: { nombre?: string } | null })[])
      .flatMap((b) => {
        const key = String(b._id);
        const bj = jarsPorLote.get(key) ?? [];
        const br = recsPorLote.get(key) ?? [];
        const resumen = resumenLote(b, bj, br);
        if (resumen.estadoDerivado !== "en_progreso") return [];
        return [
          {
            _id: key,
            numeroLote: b.numeroLote,
            hongo: b.fungusTypeId?.nombre ?? "—",
            frascosActivos: contar(bj, "colonizando") + contar(bj, "colonizado"),
            incubando: contar(br, "incubando"),
            fructificando: contar(br, "fructificando"),
            alertas: resumen.alertas,
          },
        ];
      })
      .sort((a, b) => b.numeroLote.localeCompare(a.numeroLote));

    const data: GestionResumen = {
      frascos: {
        colonizando: contar(jars, "colonizando"),
        colonizado: contar(jars, "colonizado"),
        contaminados30d: contaminados30d(jars),
      },
      recipientes: {
        incubando: contar(recipientes, "incubando"),
        fructificando: contar(recipientes, "fructificando"),
        contaminados30d: contaminados30d(recipientes),
      },
      lotesActivos,
    };
    return ok(data);
  } catch (err) {
    return handleApiError(err);
  }
}
