import type { NextRequest } from "next/server";
import { ok, handleApiError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/api-auth";
import { getInfluxConfig, runFlux } from "@/lib/influx";
import { fluxEquipos } from "@/lib/monitoreo/flux";
import { INFLUX_ID_RE, type EquipoInflux } from "@/lib/monitoreo/tipos";

// Equipos que escribieron en el bucket (ultimos 30 dias): su tag `id` fijo y
// el ultimo nombre `device` (cambia si se renombra el equipo). Se usa para
// el selector del formulario de dispositivo.
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const config = getInfluxConfig();
    const rows = await runFlux(fluxEquipos(config.bucket), config);

    const porId = new Map<string, EquipoInflux>();
    for (const r of rows) {
      const id = r.id?.toLowerCase();
      if (!id || !INFLUX_ID_RE.test(id)) continue;
      porId.set(id, { id, device: r.device ?? null });
    }
    const equipos = [...porId.values()].sort((a, b) =>
      (a.device ?? a.id).localeCompare(b.device ?? b.id)
    );
    return ok(equipos);
  } catch (err) {
    return handleApiError(err);
  }
}
