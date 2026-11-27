import { Suspense } from "react";
import { ARTE_FIGURAS } from "@/components/figuras";
import { MonitoreoInvernadero } from "@/components/monitoreo/MonitoreoInvernadero";

/** Monitoreo detallado de un invernadero, abierto desde la vista en vivo (`?dispositivo=` elige el equipo). */
export default function MonitoreoInvernaderoPage() {
  // shortcut: manda el arte de todos los modelos (hoy uno, ~66 KB gzip); si hay varios, elegir por modelo en el servidor.
  return (
    <Suspense>
      <MonitoreoInvernadero arte={ARTE_FIGURAS} />
    </Suspense>
  );
}
