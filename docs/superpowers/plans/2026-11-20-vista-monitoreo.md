# Vista de monitoreo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Página `/monitoreo` ("Vista de monitoreo") con el estado de los equipos ESP32 de cada invernadero (InfluxDB) y el inventario vivo y los lotes activos (MongoDB).

**Architecture:** Dos API routes nuevas, solo servidor:
- `GET /api/monitoreo/resumen` hace 5 consultas Flux en paralelo para todos los `influxId` del usuario y arma un resumen por equipo con una función pura (`resumirEquipo`).
- `GET /api/monitoreo/gestion` cuenta frascos y recipientes con Mongo y reutiliza `resumenLote` para los lotes activos.

Una página cliente consume las dos, se refresca cada 60 s y degrada sección por sección: si falla Influx, la gestión se sigue viendo.

**Tech Stack:** Next.js 16 (App Router, leer `node_modules/next/dist/docs/` antes de tocar rutas), React 19, TypeScript, Mongoose, Vitest, next-intl, Phosphor, componentes Kallampa (`src/components/kallampa`).

**Spec:** `docs/superpowers/specs/2026-11-20-vista-monitoreo-design.md`

## Global Constraints

- El token de Influx nunca llega al cliente ni a los logs. Solo `src/app/api/**` importa `@/lib/influx`.
- Todo valor interpolado en Flux está validado: ids con `INFLUX_ID_RE` (`/^[0-9a-f]{6}$/`), el bucket sin `"`, `\` ni salto de línea (mismo criterio que `assertSeguro` en `src/lib/monitoreo/flux.ts`).
- `estado` mezcla tipos: `pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")` **sin `group()` antes**.
- Desconectado = último `estado` con más de `2 × intervalo_min` minutos. Señal mala = `rssi < -80`.
- Las horas de Influx están en UTC; en la UI se muestran en hora local.
- Los errores usan el formato del proyecto `codigo:Mensaje en español` (`ApiError`, `handleApiError`), con la traducción al inglés en `messages/en/errors.json`.
- Todos los textos de la UI van en `messages/{es,en}/*.json`.
- Pruebas manuales solo con `npm run dev:agent` (puerto 3099, base `cultivo_hongos_agent`). Nunca usar `npm run dev` ni la base `cultivo_hongos`.
- Los tests de API mockean `fetch` (patrón de `src/app/api/invernaderos/serie.test.ts`) y nunca le pegan a Influx real.

## Review Focus

1. **Equipo renombrado (cambia el tag `device`, mismo `id`):** Influx devuelve dos tablas para el mismo id. Se espera un solo equipo, con el dato más reciente. Lo prueba Task 1, `fusiona filas del mismo id`.
2. **Equipo con `ambiente` pero sin `estado` en 24 h** (por ejemplo, antes del 2026-11-20): se espera `conexion: "sin_datos"`, el clima igual visible y el rango tomado de los valores manuales del dispositivo. Lo prueba Task 1, `sin estado usa rango manual`.
3. **`agua_vacia` ausente** (equipo sin flotante): no debe aparecer la alarma de agua. Lo prueba Task 1, `sin agua_vacia no alarma`.
4. **Faltan las variables `INFLUX_*` o Influx da timeout:** el resumen responde con el error del proyecto y la página igual muestra la gestión. Lo prueba Task 2 en la ruta; la UI se verifica en Task 4, paso de verificación.
5. **Usuario sin invernaderos ni dispositivos con `influxId`:** no debe consultar Influx y debe devolver `invernaderos: []` (o equipos `sin_influx`). Lo prueba Task 2, `no consulta influx si no hay influxId`.

---

### Task 1: Consultas Flux y resumen puro por equipo

**Files:**
- Modify: `src/lib/monitoreo/tipos.ts` (agregar tipos al final)
- Modify: `src/lib/monitoreo/flux.ts` (agregar 5 builders)
- Create: `src/lib/monitoreo/resumen.ts`
- Test: `src/lib/monitoreo/resumen.test.ts`

**Interfaces:**
- Produces, en `tipos.ts`:
  ```ts
  export type Conexion = "conectado" | "desconectado" | "sin_datos" | "sin_influx";
  export interface RangoObjetivo { min: number | null; max: number | null }
  export interface Aparato { on: boolean | null; potencia: number | null; aprendiendo: boolean }
  export type Alarma = "agua_vacia" | "sensor_falla" | "wifi_debil";
  export interface Stats { min: number; max: number; prom: number }
  export interface EquipoResumen {
    dispositivoId: string; nombre: string; influxId: string | null;
    conexion: Conexion;
    ultimoEstado: number | null;          // epoch ms del último `estado`
    vaciandoCola: boolean;                // pendientes > 0
    ahora: { t: number | null; temperatura: number | null; humedad: number | null };
    rangoTemp: RangoObjetivo; rangoHum: RangoObjetivo;
    fueraTemp: "alta" | "baja" | null; fueraHum: "alta" | "baja" | null;
    aparatos: { humidificador: Aparato; calefaccion: Aparato; extractor: Aparato };
    alarmas: Alarma[];
    dia: {
      temp: Stats | null; hum: Stats | null;
      enRangoPct: { temp: number | null; hum: number | null };
      usoPct: { humidificador: number; calefaccion: number; extractor: number };
      reinicios: number; ultimoReset: string | null; fw: string | null; rssi: number | null;
    };
  }
  export interface InvernaderoMonitoreo { _id: string; nombre: string; equipos: EquipoResumen[] }
  export interface ResumenMonitoreo { invernaderos: InvernaderoMonitoreo[]; generado: number }
  ```
- Produces, en `flux.ts`, todas con firma `(bucket: string, ids: string[]) => string`. Todas lanzan un error si algún id no pasa `INFLUX_ID_RE` o si el bucket es inseguro. Todas filtran con `contains(value: r.id, set: [...])` y `range(start: -24h)`:
  - `fluxUltimoEstado`: `_measurement == "estado"`, `last()`, después el pivot sin `group()`.
  - `fluxUltimoAmbiente`: `ambiente`, `last()`, pivot.
  - `fluxAmbiente24h`: `ambiente`, `aggregateWindow(every: 5m, fn: mean, createEmpty: false)`, pivot.
  - `fluxActuadores24h`: `actuadores`, `sum()`, pivot.
  - `fluxReinicios24h`: `estado`, `_field == "uptime_s"`, `difference()`, `filter(fn: (r) => r._value < 0)`, `count()`, `keep(columns: ["id", "_value"])`.
- Produces, en `resumen.ts`:
  ```ts
  type Fila = Record<string, string | null>;
  export function filasPorId(filas: Fila[]): Map<string, Fila>;      // fusiona por id, gana el _time más reciente por campo
  export function resumirEquipo(input: {
    dispositivo: { _id: string; nombre: string; influxId?: string | null;
                   tempMin?: number; tempMax?: number; humMin?: number; humMax?: number };
    estado: Fila | null; ambiente: Fila | null;
    ventanas: Fila[];                          // filas de fluxAmbiente24h de ese id
    actuadores: Fila | null; reinicios: number; now: number;
  }): EquipoResumen;
  ```
  Booleanos del CSV: `"true"` / `"false"`. Números: `Number()` finito o `null`. `usoPct = Σseg / 86400 × 100`, con un decimal. `enRangoPct` = % de ventanas con el valor dentro de `[min, max]`; `null` si falta `min` o `max` o si no hay ventanas.

- [ ] **Step 1: Write the failing tests** en `resumen.test.ts`. Usar `now = Date.parse("2026-11-20T12:00:00Z")` y un dispositivo `{ _id: "d1", nombre: "Carpa 1", influxId: "0c2cc8", tempMin: 18, tempMax: 24, humMin: 80, humMax: 90 }`:
  - `conectado si el último estado tiene ≤ 2 × intervalo_min`: estado `_time 11:58:30Z`, `intervalo_min "1"` → `conexion === "conectado"`, `ultimoEstado === Date.parse("2026-11-20T11:58:30Z")`.
  - `desconectado pasado 2 × intervalo_min`: estado `_time 11:57:00Z`, `intervalo_min "1"` → `"desconectado"`.
  - `sin estado usa rango manual`: `estado: null`, ambiente `temperatura "25.2"` → `conexion === "sin_datos"`, `rangoTemp` igual a `{ min: 18, max: 24 }`, `fueraTemp === "alta"`.
  - `el rango del equipo gana al manual`: estado `temp_min "20", temp_max "26"` y temperatura 25.2 → `fueraTemp === null`.
  - `alarmas`: estado `agua_vacia "true", sensor_ok "false", rssi "-85"` → `alarmas` igual a `["agua_vacia", "sensor_falla", "wifi_debil"]`.
  - `sin agua_vacia no alarma`: estado sin la clave `agua_vacia`, `sensor_ok "true"`, `rssi "-60"` → `alarmas` igual a `[]`.
  - `aparatos`: `hum_on "true", hum_pot "42.5", hum_aprendiendo "true", calef_on "false", ext_on "false"` → `aparatos.humidificador` igual a `{ on: true, potencia: 42.5, aprendiendo: true }`.
  - `día`:
    - entrada: ventanas con temperatura `[19, 22, 25, null]`, actuadores `{ calefaccion_seg: "8640", humidificador_seg: "0", extractor_seg: "43200" }`, `reinicios: 2`;
    - esperado: `dia.temp` igual a `{ min: 19, max: 25, prom: 22 }`, `dia.enRangoPct.temp === 66.7`, `dia.usoPct` igual a `{ humidificador: 0, calefaccion: 10, extractor: 50 }`, `dia.reinicios === 2`.
  - `vaciando cola`: `pendientes "3"` → `vaciandoCola === true`.
  - `sin_influx`: dispositivo sin `influxId` → `conexion === "sin_influx"` y `ahora.temperatura === null`.
  - `fusiona filas del mismo id`: `filasPorId` con dos filas `id "0c2cc8"`:
    - fila 1: `device "viejo"`, `_time 10:00Z`, `temperatura "20"`;
    - fila 2: `device "nuevo"`, `_time 11:00Z`, `temperatura "21"`, `humedad null`;
    - esperado: una sola entrada con `temperatura === "21"` y `device === "nuevo"`.
  - `builders validan ids`: `expect(() => fluxUltimoEstado("b", ["0c2cc8\")"])).toThrow()`. Además, `fluxUltimoEstado("b", ["0c2cc8"])` contiene `pivot(rowKey: ["_time"]` y no contiene `group()` antes del pivot (`/group\(\)[\s\S]*pivot/` no matchea).
- [ ] **Step 2: Run** `npx vitest run src/lib/monitoreo/resumen.test.ts`. Expected: FAIL, porque las funciones no existen todavía.
- [ ] **Step 3: Implement** los tipos, los 5 builders y `filasPorId` / `resumirEquipo` con las firmas de arriba.
- [ ] **Step 4: Run** `npx vitest run src/lib/monitoreo`. Expected: todo PASS, incluido el `monitoreo.test.ts` que ya existía.
- [ ] **Step 5: Commit** `git add src/lib/monitoreo && git commit -m "monitoreo: consultas flux y resumen por equipo"`

### Task 2: `GET /api/monitoreo/resumen`

**Files:**
- Create: `src/app/api/monitoreo/resumen/route.ts`
- Test: `src/app/api/monitoreo/resumen.test.ts`
- Modify: `messages/en/errors.json`, solo si aparece un código nuevo (no debería, porque se reutilizan los `influx_*`).

**Interfaces:**
- Consumes: Task 1 (los builders, `filasPorId`, `resumirEquipo`, `ResumenMonitoreo`), `requireAuth`, `getInfluxConfig`, `runFlux`, `Invernadero`.
- Produces: `GET /api/monitoreo/resumen` → `ok<ResumenMonitoreo>`, con `export const maxDuration = 30`.
  - Recorre los invernaderos `activo: true` del usuario, en orden de nombre.
  - Arma un `EquipoResumen` por cada dispositivo.
  - Las 5 consultas corren en paralelo, una sola vez, con todos los `influxId` en minúscula.
  - Si ningún dispositivo tiene `influxId`, no llama a `getInfluxConfig` ni a `fetch`, y todos los equipos quedan `sin_influx`.

- [ ] **Step 1: Write the failing tests**, con el setup de `serie.test.ts`: `stubEnv`, `fetchMock`, `makeUser`, `makeInvernadero` y el POST de un dispositivo con `influxId "0C2CC8"`. Responder a cada consulta según el `_measurement` del body:
  - `arma el resumen por invernadero sin exponer el token`: 200; `data.invernaderos[0].equipos[0].influxId === "0c2cc8"`; `JSON.stringify(json)` no contiene el `TOKEN`; `fetchMock` llamado 5 veces.
  - `no consulta influx si no hay influxId`: dispositivo sin `influxId` → `fetchMock` no llamado, y `conexion === "sin_influx"`.
  - `503 si faltan las variables INFLUX_*` (con `vi.unstubAllEnvs()` y un dispositivo con `influxId`): `status 503`, `json.code === "influx_no_configurado"`.
  - `error de red → influx_sin_conexion`: `fetchMock.mockRejectedValue(new TypeError("x"))` → `status 502`.
  - `401 sin sesión`: sin headers → `status 401`.
  - `no mezcla usuarios`: un segundo usuario con su propio invernadero no aparece en la respuesta del primero.
- [ ] **Step 2: Run** `npx vitest run src/app/api/monitoreo/resumen.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement the route.** Para cada `influxId`, `ventanas` son las filas de `fluxAmbiente24h` con ese id, sin fusionar, y `reinicios` es `Number(_value)` de la fila de `fluxReinicios24h`, o `0` si no hay fila.
- [ ] **Step 4: Run** `npx vitest run src/app/api/monitoreo`. Expected: PASS.
- [ ] **Step 5: Commit** `git add src/app/api/monitoreo && git commit -m "monitoreo: endpoint de resumen de equipos"`

### Task 3: `GET /api/monitoreo/gestion`

**Files:**
- Create: `src/app/api/monitoreo/gestion/route.ts`
- Modify: `src/lib/types.ts` (agregar `GestionResumen`)
- Test: `src/app/api/monitoreo/gestion.test.ts`

**Interfaces:**
- Consumes: `requireAuth`, `Batch`, `Jar`, `Recipiente`, y `resumenLote` de `@/lib/metrics` (igual que `src/app/api/batches/route.ts`).
- Produces:
  ```ts
  export interface GestionResumen {
    frascos: { colonizando: number; colonizado: number; contaminados30d: number };
    recipientes: { incubando: number; fructificando: number; contaminados30d: number };
    lotesActivos: { _id: string; numeroLote: string; hongo: string; frascosActivos: number;
                    incubando: number; fructificando: number; alertas: number }[];
  }
  ```
  - `contaminados30d` cuenta `estado: "contaminado"` con `updatedAt >= now − 30 días`.
  - `lotesActivos` son los lotes con `estadoDerivado === "en_progreso"`, ordenados por `numeroLote` descendente.
  - `frascosActivos` = colonizando + colonizado.
  - `hongo` = `fungusTypeId.nombre`, o `"—"`.

- [ ] **Step 1: Write the failing tests**, usando `makeBatch`, `colonizarJars`, `makeRecipiente`, `fructificarRecipiente` y el `PATCH /api/jars/[id]` para marcar un frasco como contaminado:
  - `cuenta frascos y recipientes vivos`: lote con 3 frascos, 1 colonizado y 1 contaminado, más 1 recipiente fructificando. Esperado: `frascos` igual a `{ colonizando: 1, colonizado: 1, contaminados30d: 1 }`, `recipientes.fructificando === 1`.
  - `lotes activos con sus conteos`: `lotesActivos[0]` coincide con `{ frascosActivos: 2, fructificando: 1 }`.
  - `excluye lotes finalizados`: un lote con todos los frascos usados o contaminados y sin recipientes activos no aparece en `lotesActivos`.
  - `no mezcla usuarios`: los datos de otro usuario no suman.
- [ ] **Step 2: Run** `npx vitest run src/app/api/monitoreo/gestion.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Contar con `countDocuments` (o un `aggregate $group` por estado), filtrando siempre por `userId`.
- [ ] **Step 4: Run** `npx vitest run src/app/api/monitoreo`. Expected: PASS.
- [ ] **Step 5: Commit** `git add src/app/api/monitoreo src/lib/types.ts && git commit -m "monitoreo: endpoint de inventario vivo y lotes activos"`

### Task 4: Página `/monitoreo` y entrada en la barra lateral

**Files:**
- Create: `src/app/monitoreo/page.tsx`
- Create: `src/components/monitoreo/vista/EquipoCard.tsx`, `InventarioVivo.tsx`, `LotesActivos.tsx`
- Modify: `src/components/shared/nav.ts`: primer link del grupo `seguimiento`, `{ href: "/monitoreo", key: "monitoreo", icon: GaugeIcon }`, y el tipo `NavKey` si hace falta.
- Modify: `messages/{es,en}/common.json`: `nav.monitoreo` = "Vista de monitoreo" / "Monitoring view".
- Modify: `messages/{es,en}/pages.json`: el namespace `pages.monitoreo.*` con todos los textos de abajo.

**Interfaces:**
- Consumes: `GET /api/monitoreo/resumen` → `ResumenMonitoreo` (Task 1/2) y `GET /api/monitoreo/gestion` → `GestionResumen` (Task 3), las dos vía `apiFetch`.
- Produces: `EquipoCard({ equipo }: { equipo: EquipoResumen })`, `InventarioVivo({ data }: { data: GestionResumen })` y `LotesActivos({ lotes }: { lotes: GestionResumen["lotesActivos"] })`.

Layout y comportamiento:
- **Cabecera:** `PageHeader` con el título "Vista de monitoreo" y la línea "Actualizado hace {tiempo}".
- **Equipos:**
  - Una `SectionCard` por invernadero, con un `EquipoCard` por equipo en una grilla `grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))]`.
  - Si el resumen falla, la sección muestra el mensaje traducido del error (`translateErrorMessage`) en un `EmptyState`.
- **Gestión:** debajo, `InventarioVivo` (4 cifras grandes más una línea con los contaminados de los últimos 30 días) y `LotesActivos` (lista con enlace a `/lotes/[id]` y `StatusTag` / alertas).
- **`EquipoCard`:**
  - Nombre y punto de conexión, con texto además del color: "Conectado", "Desconectado hace 12 min", "Sin datos" o "Sin InfluxDB".
  - Temperatura y humedad grandes, con el rango "18–24 °C" debajo; fuera de rango en `text-danger-text` con "Alta" o "Baja" escrito.
  - Fila de aparatos con ícono, estado y potencia; "Aprendiendo" como etiqueta.
  - Alarmas como lista de avisos con `WarningCircleIcon`: "Tanque de agua vacío", "Sensor sin lectura", "Señal WiFi débil ({rssi} dBm)".
  - "Vaciando cola" como nota.
  - Un bloque "Últimas 24 h": mín/máx/prom, "% en rango", "% de uso" por aparato, "{n} reinicios · último: {reset}" y "Firmware {fw}" en `text-text-subtle`.
- **Refresco:** cada 60 s con `setInterval`, que se pausa con `document.visibilityState !== "visible"` y refresca al volver. Las dos llamadas son independientes: una que falla no borra la otra.
- **Celular:** una columna, sin scroll horizontal a 390 px.

- [ ] **Step 1: Implement** la página, los 3 componentes, el link en la barra y los mensajes en es/en.
- [ ] **Step 2: Run** `npx tsc --noEmit && npx eslint src && npm test`. Expected: sin errores y todos los tests en PASS.
- [ ] **Step 3: Verify in the real app.**
  - Levantar `npm run dev:agent`, con las variables `INFLUX_*` reales en `.env.local` (solo lectura del bucket), y cargar en un invernadero de `cultivo_hongos_agent` dos dispositivos con `influxId` `0c2cc8` y `d2d0e0`.
  - Abrir `/monitoreo` a 1440 px y a 390 px.
  - Expected:
    - los dos equipos aparecen con clima y estado de conexión;
    - la gestión muestra los conteos;
    - no hay errores en la consola;
    - el token no aparece en la pestaña Network.
  - Después, sacar `INFLUX_URL` y reiniciar. Expected: la sección de equipos muestra "El monitoreo no está configurado…" y la gestión se sigue viendo.
- [ ] **Step 4: Commit** `git add src/app/monitoreo src/components/monitoreo/vista src/components/shared/nav.ts messages && git commit -m "monitoreo: vista general de equipos y gestión"`
