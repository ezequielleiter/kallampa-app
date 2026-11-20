# Monitoreo en vivo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La vista `/monitoreo` lee `GET http://<dominio>/sensors` de cada equipo cada 3 s desde Chrome y pisa con eso los datos "ahora" de Influx.

**Architecture:** Lógica pura en `src/lib/monitoreo/vivo.ts` (parseo, host, mezcla). Un hook cliente sondea cada equipo en un bucle secuencial con Local Network Access (`targetAddressSpace: "local"`). La página mezcla y la tarjeta muestra "EN VIVO" / "SIN CONEXIÓN LOCAL".

**Tech Stack:** Next.js 16 (client components), React 19, TS, next-intl, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-20-monitoreo-en-vivo-design.md`

## Global Constraints

- Nunca dos pedidos en vuelo al mismo equipo; entre respuesta y próximo pedido, 3000 ms; timeout 3000 ms (`AbortSignal.timeout(3000)`).
- `fetch(url, { mode: "cors", targetAddressSpace: "local" } as RequestInit)` — el campo no está en los tipos de TS.
- Permiso: `navigator.permissions.query({ name: "local-network" as PermissionName })` en try/catch; error ⇒ `"prompt"`. Nunca consultar `"local-network-access"`.
- Con permiso `prompt`, el primer pedido sale del clic en "Conectar con los equipos". Con `granted`, arranca solo.
- Pestaña oculta ⇒ no se pide nada.
- Textos en `messages/{es,en}/pages.json` bajo `pages.monitoreo.vivo.*`, con paridad de claves.
- No usar `npm run dev`; verificar con `npm run dev:agent` (3099) desde un worktree.

## Review Focus

1. `dominio` con ruta o puerto (`sensor.local:8080/panel`) ⇒ se pide `http://sensor.local:8080/sensors`. (Task 1 test)
2. `/sensors` con forma inesperada (HTML, `{}`, `temperature: "x"`) ⇒ se trata como falla, no rompe la tarjeta. (Task 1 test)
3. `water: "ok"` no alarma; `water: null` no alarma; `water: false` o `"vacio"` alarma. (Task 1 test)
4. Equipo sin `influxId` pero con dominio ⇒ en vivo igual muestra temperatura y humedad (rango sin datos ⇒ `fuera` null). (Task 1 test)
5. Equipo que deja de responder ⇒ al primer timeout la tarjeta pasa a "Sin conexión local" y vuelve a los valores de Influx (no se queda con el último valor en vivo). (Task 2, verificación manual)

---

### Task 1: Lógica pura de "en vivo" + `dominio` en el resumen

**Files:**
- Create: `src/lib/monitoreo/vivo.ts`, `src/lib/monitoreo/vivo.test.ts`
- Modify: `src/lib/monitoreo/tipos.ts` (`EquipoResumen.dominio: string`), `src/lib/monitoreo/resumen.ts` (exportar `fuera`; `dispositivo.dominio` pasa a la salida), `src/app/api/monitoreo/resumen/route.ts` (pasar `dominio: d.dominio`), `src/lib/monitoreo/resumen.test.ts` (fixtures con `dominio`)

**Interfaces:**
- Produces:
  - `interface SensorsVivo { temperature: number | null; humidity: number | null; ok: boolean; retrying: boolean; humidifier: boolean; heater: boolean; extractor: boolean; humPower: number | null; heatPower: number | null; heatMode: string | null; water: boolean | string | null; extractorPaused: boolean; extractorWaitingHum: boolean; extractorRemaining: number | null }`
  - `parseSensors(json: unknown): SensorsVivo | null` — null si no es objeto o si `ok`/`humidifier`/`heater`/`extractor` no son boolean; números no finitos ⇒ null.
  - `urlSensors(dominio: string): string | null` — `http://<host[:puerto]>/sensors`, descartando esquema y ruta; null si vacío.
  - `aplicarVivo(e: EquipoResumen, s: SensorsVivo): EquipoResumen`
  - `export function fuera(v: number | null, r: RangoObjetivo): "alta" | "baja" | null` desde `resumen.ts`.

- [ ] **Step 1: tests en `vivo.test.ts`**
  - `urlSensors("fungi-colonizacion.local")` → `"http://fungi-colonizacion.local/sensors"`; `urlSensors("http://192.168.1.202/")` → `"http://192.168.1.202/sensors"`; `urlSensors("sensor.local:8080/panel")` → `"http://sensor.local:8080/sensors"`; `urlSensors("  ")` → `null`.
  - `parseSensors` del JSON real de fructificación (`{"temperature":23.3,"humidity":85.9,"ok":true,"retrying":false,"humidifier":false,"humMode":"model","humPower":18,"humLearnWindows":106,"heater":false,"heatMode":"learning","heatPower":null,"heatLearnCycle":0,"extractor":false,"extractorPaused":false,"extractorWaitingHum":false,"water":"ok","extractorRemaining":200,"extractorRemainingMs":199371}`) → objeto con `humPower: 18`, `water: "ok"`, `extractorRemaining: 200`; `parseSensors("<html>")`, `parseSensors({})`, `parseSensors({...valido, ok: "si"})` → `null`.
  - `aplicarVivo` sobre un `EquipoResumen` con `rangoHum {min:85,max:95}` y `s.humidity 38.2` → `ahora.humedad 38.2`, `fueraHum "baja"`; `aparatos.calefaccion` → `{ on: s.heater, potencia: s.heatPower, aprendiendo: true }` cuando `heatMode === "learning"`; humidificador conserva `aprendiendo` de entrada.
  - Alarmas: `retrying: true` ⇒ incluye `"sensor_falla"`; `water: "ok"`/`null` ⇒ sin `"agua_vacia"`; `water: false` y `water: "vacio"` ⇒ con `"agua_vacia"`; `"wifi_debil"` de entrada se conserva; sin duplicados.
  - Equipo con `influxId: null`, rangos null ⇒ `ahora.temperatura` del vivo, `fueraTemp` null.
- [ ] **Step 2:** `npx vitest run src/lib/monitoreo/vivo.test.ts` → FAIL (módulo inexistente).
- [ ] **Step 3:** implementar `vivo.ts`; `aplicarVivo` recalcula `alarmas` como: las de entrada sin `sensor_falla`/`agua_vacia` + las derivadas del vivo. Agregar `dominio` a tipos/resumen/route y fixtures.
- [ ] **Step 4:** `npx vitest run src/lib/monitoreo src/app/api/monitoreo` → PASS; `npx tsc --noEmit` limpio.
- [ ] **Step 5:** commit `monitoreo: logica de datos en vivo desde /sensors`.

### Task 2: Hook de sondeo y permiso de red local

**Files:**
- Create: `src/components/monitoreo/vista/useEnVivo.ts`

**Interfaces:**
- Consumes: `urlSensors`, `parseSensors`, `SensorsVivo` (Task 1).
- Produces:
  - `type PermisoRed = "granted" | "prompt" | "denied"`
  - `type Vivo = { sensors: SensorsVivo | null; at: number | null }` — `sensors` null tras una falla (timeout, red, parseo); `at` = epoch ms de la última respuesta válida.
  - `useEnVivo(equipos: { dispositivoId: string; dominio: string }[]): { permiso: PermisoRed; conectar: () => void; vivo: Record<string, Vivo> }`

- [ ] **Step 1:** implementar. Permiso consultado al montar (try/catch ⇒ `"prompt"`), escuchando `change`. Sondeo activo si `permiso === "granted"` o tras `conectar()`. Un bucle async por equipo con `urlSensors` no nulo, cancelado con un `AbortController` al desmontar o cambiar la lista (clave: ids+dominios unidos). Pestaña oculta ⇒ el bucle espera sin pedir. Cualquier error ⇒ `{ sensors: null, at: anterior }`. Si un pedido tiene éxito estando en `prompt`, pasar a `granted`.
- [ ] **Step 2:** `npx tsc --noEmit` y `npx eslint src/components/monitoreo` limpios (sin `Date.now()` en render).
- [ ] **Step 3:** commit `monitoreo: sondeo local de los equipos`.

### Task 3: UI en vivo

**Files:**
- Modify: `src/app/monitoreo/page.tsx`, `src/components/monitoreo/vista/EquipoCard.tsx`, `messages/es/pages.json`, `messages/en/pages.json`

**Interfaces:**
- Consumes: `useEnVivo`, `aplicarVivo` (Tasks 1–2).
- `EquipoCard` suma la prop `vivo: Vivo | null` (null = sin sondeo: se ve como hoy).

- [ ] **Step 1: textos** `pages.monitoreo.vivo`: es `{ "enVivo": "En vivo", "sinLocal": "Sin conexión local", "conectar": "Conectar con los equipos", "denegado": "Chrome bloqueó el acceso a la red local. Habilitalo en el candado de la barra de direcciones → Red local.", "extPausa": "en pausa", "extEsperando": "esperando humedad", "extCambia": "cambia en {t}" }`; en: `"Live"`, `"No local connection"`, `"Connect to devices"`, `"Chrome blocked local network access. Allow it from the lock icon in the address bar → Local network."`, `"paused"`, `"waiting for humidity"`, `"changes in {t}"`.
- [ ] **Step 2: página.** `const { permiso, conectar, vivo } = useEnVivo(equipos.map(...))`; equipos mostrados (tarjetas y `AlertasPanel`) = `vivo[id]?.sensors ? aplicarVivo(e, sensors) : e`. En la barra: botón outline "Conectar con los equipos" si `permiso === "prompt"`; texto `danger-text` con `vivo.denegado` si `"denied"`. Para pasar el resumen mezclado a `AlertasPanel`, construir un `ResumenMonitoreo` con los equipos mezclados.
- [ ] **Step 3: tarjeta.** En el encabezado: con `vivo?.sensors` ⇒ punto acento + "EN VIVO" + `hace N s` (de `vivo.at`, reloj de 1 s propio del componente); con `vivo && !vivo.sensors` ⇒ punto gris + "SIN CONEXIÓN LOCAL" + el texto actual de Influx (`conexion` + hace X). Sin `vivo` ⇒ como hoy. En la fila del extractor, con vivo: `extPausa` / `extEsperando` / `extCambia` con `m:ss` de `extractorRemaining`.
- [ ] **Step 4:** `npx tsc --noEmit`, `npx eslint src/app/monitoreo src/components/monitoreo`, `npm test` → limpio/verde.
- [ ] **Step 5: verificación manual** en worktree con `npm run dev:agent` (3099) en esta máquina (misma red 192.168.1.x): poner en la base agent `dominio` `192.168.1.202` y `192.168.1.142` a los dos equipos; ver "EN VIVO" y valores cambiando; cambiar un dominio a `192.168.1.250` ⇒ "SIN CONEXIÓN LOCAL" en ≤ 6 s. (Página en localhost ⇒ sin prompt de LNA; el permiso se prueba en producción.)
- [ ] **Step 6:** commit `monitoreo: datos en vivo en la vista`.
