import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tarea from "@/models/Tarea";
import Jar from "@/models/Jar";
import Recipiente from "@/models/Recipiente";
import Placa from "@/models/Placa";
import Batch from "@/models/Batch";
import Clonacion from "@/models/Clonacion";
import { ok, handleApiError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import {
  lotePillsPendientes,
  type LeanBatch,
  type LeanClonacion,
  type LeanJar,
  type LeanRecipiente,
  type LeanPlaca,
} from "@/lib/metrics";

// GET /api/calendario?year=&month= — combina las tareas manuales del mes
// con los pills automaticos de etapa ("deberia terminar en esta fecha"),
// calculados al vuelo a partir de lo que hoy sigue activo (jar/placa
// "colonizando", recipiente "incubando"/"fructificando"). Sin year/month,
// usa el mes calendario actual (UTC).
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = Number(searchParams.get("year")) || now.getUTCFullYear();
    const month = Number(searchParams.get("month")) || now.getUTCMonth() + 1;
    const desde = new Date(Date.UTC(year, month - 1, 1));
    const hasta = new Date(Date.UTC(year, month, 1));

    const tareas = await Tarea.find({ userId, fecha: { $gte: desde, $lt: hasta } })
      .sort({ fecha: 1 })
      .lean();

    const [jarsColonizando, recipientesIncubando, recipientesFructificando, placasColonizando] =
      await Promise.all([
        Jar.find({ userId, estado: "colonizando" }).select("batchId").lean() as unknown as Promise<
          Pick<LeanJar, "batchId">[]
        >,
        Recipiente.find({ userId, estado: "incubando" }).lean() as unknown as Promise<LeanRecipiente[]>,
        Recipiente.find({ userId, estado: "fructificando" }).lean() as unknown as Promise<LeanRecipiente[]>,
        Placa.find({ userId, estado: "colonizando" }).select("clonacionId").lean() as unknown as Promise<
          Pick<LeanPlaca, "clonacionId">[]
        >,
      ]);

    const batchIds = [...new Set(jarsColonizando.map((j) => String(j.batchId)))];
    const clonacionIds = [...new Set(placasColonizando.map((p) => String(p.clonacionId)))];

    const [batches, clonaciones] = await Promise.all([
      Batch.find({ userId, _id: { $in: batchIds } }).lean() as unknown as Promise<LeanBatch[]>,
      Clonacion.find({
        userId,
        _id: { $in: clonacionIds },
        origenProceso: "placa",
      }).lean() as unknown as Promise<LeanClonacion[]>,
    ]);

    const lotePills = lotePillsPendientes({
      jarsColonizando,
      batches,
      recipientesIncubando,
      recipientesFructificando,
      placasColonizando,
      clonaciones,
      desde,
      hasta,
    });

    return ok({ tareas, lotePills });
  } catch (err) {
    return handleApiError(err);
  }
}
