# Monitoreo por invernadero desde la vista en vivo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cada tarjeta de equipo de `/monitoreo` tiene un botón "Monitoreo" que abre una página propia `/monitoreo/[id]` con el monitoreo detallado de ese invernadero (gráficos, consumo, ciclos), con el equipo de la tarjeta ya elegido.

**Architecture:** No hay datos ni API nuevos. La página nueva es un client component que pide `GET /api/invernaderos/[id]` (la misma llamada de `/invernaderos/[id]`) y monta el `MonitoreoPanel` existente, que ya trae selector de equipo, pestañas calefacción/humedad, rangos, `BarChart`, `ConsumoResumen` y `CiclosTable`. El equipo inicial viaja como query `?dispositivo=<dispositivoId>`. La página queda sin sidebar ni topbar, igual que `/monitoreo`.

**Tech Stack:** Next.js (versión del repo — leer `node_modules/next/dist/docs/` antes de usar `useParams`/`useSearchParams`), React client components, next-intl, Tailwind, `@phosphor-icons/react`.

**Spec:** Pedido del usuario (2026-11-27): "en esa misma vista donde veo las características de los invernaderos, quiero un botón de 'monitoreo' y que me abra una sección de monitoreo de ese invernadero". Decisión del usuario: **página propia** (no panel lateral ni tarjeta expandida). Contexto: `docs/superpowers/specs/2026-11-20-vista-monitoreo-design.md`, `docs/superpowers/specs/2026-11-20-monitoreo-en-vivo-design.md`.

## Global Constraints

- Ruta: `/monitoreo/[id]`, `id` = `_id` del invernadero. Query opcional `dispositivo` = `_id` del dispositivo (`EquipoResumen.dispositivoId`).
- Toda copia nueva va en `messages/es/pages.json` y `messages/en/pages.json` bajo `pages.monitoreo` (nada hardcodeado).
- El token de Influx nunca llega al cliente: la página solo usa las API routes existentes.
- Para correr la app y verificar: `npm run dev:agent` (puerto 3099, base `cultivo_hongos_agent`). Nunca `npm run dev` ni la base `cultivo_hongos`.
- Sin dependencias nuevas.

## Review Focus

1. `?dispositivo=` ausente, inválido o de otro invernadero → se muestra el primer equipo vinculado a Influx, sin error (el fallback `?? vinculados[0]` de `MonitoreoPanel` ya lo cubre; no romperlo).
2. `id` inexistente o de otro usuario (API responde 404) → la página muestra "No se encontró el invernadero" y el botón volver, no queda en blanco ni crashea.
3. Invernadero sin ningún dispositivo con `influxId` (URL escrita a mano) → `MonitoreoPanel` devuelve `null`; la página tiene que mostrar un aviso, no una página vacía.
4. `AuthGate`: `/monitoreo/[id]` sin marco; `/monitoreo` sigue sin marco; rutas como `/monitoreoX` (no existen, pero) no deben matchear; sin sesión redirige a `/login`.
5. Celular (≈375 px): la página no tiene scroll horizontal (el `BarChart` y la `CiclosTable` ya son responsivos dentro de `/invernaderos/[id]`; verificarlo en este layout sin marco).

El repo no tiene entorno de tests de componentes (Vitest corre en `node`, sin tests `.tsx`), así que estos cinco se verifican en el navegador en la Task 2, Step 4. No se agrega infraestructura de tests de UI.

---

### Task 1: Página `/monitoreo/[id]`

**Files:**
- Create: `src/app/monitoreo/[id]/page.tsx`
- Modify: `src/components/monitoreo/MonitoreoPanel.tsx:43-55` (prop nueva)
- Modify: `src/components/shared/AuthGate.tsx:13` y el `if` que usa `SIN_MARCO`
- Modify: `messages/es/pages.json`, `messages/en/pages.json` (bloque `pages.monitoreo`)

**Interfaces:**
- Consumes: `apiFetch<Invernadero>(\`/api/invernaderos/${id}\`)` (`@/lib/api-client`, tira `Error` con mensaje en 404); `Invernadero`, `Dispositivo` de `@/lib/types`; `Logo` de `@/components/kallampa/Logo`; `Button` de `@/components/ui/button` (con `render={<Link href=… />}` como en `src/app/monitoreo/page.tsx`).
- Produces: ruta `/monitoreo/[id]?dispositivo=<dispositivoId>` (la usa la Task 2); `MonitoreoPanel` acepta `dispositivoInicial?: string`.

- [ ] **Step 1: `MonitoreoPanel` acepta `dispositivoInicial?: string`**

`useState(dispositivoInicial ?? vinculados[0]?._id)`. No tocar el fallback `vinculados.find(...) ?? vinculados[0]` (cubre Review Focus 1). `src/app/invernaderos/[id]/page.tsx` no cambia.

- [ ] **Step 2: `AuthGate` sin marco también para subrutas**

Reemplazar `SIN_MARCO.includes(pathname)` por un match de prefijo de segmento: `pathname === p || pathname.startsWith(p + "/")` para cada `p` de `SIN_MARCO`. Así `/monitoreo/abc` queda sin marco y `/monitoreoX` no.

- [ ] **Step 3: Claves i18n en `pages.monitoreo`**

| clave | es | en |
|---|---|---|
| `verMonitoreo` | `Monitoreo` | `Monitoring` |
| `detalle.titulo` | `Monitoreo` | `Monitoring` |
| `detalle.volver` | `Vista en vivo` | `Live view` |
| `detalle.noEncontrado` | `No se encontró el invernadero.` | `Greenhouse not found.` |
| `detalle.sinInflux` | `Este invernadero no tiene equipos vinculados a InfluxDB.` | `This greenhouse has no devices linked to InfluxDB.` |

Reusar las existentes `cargando`, `verInvernadero`.

- [ ] **Step 4: Crear `src/app/monitoreo/[id]/page.tsx`**

`"use client"`, `export default function MonitoreoInvernaderoPage()`. `useParams<{ id: string }>()` y `useSearchParams().get("dispositivo")` (leer `node_modules/next/dist/docs/01-app/…/use-search-params.md`; si pide `<Suspense>` en esta versión, envolver el contenido en uno). Estado `{ data: Invernadero | null; error: string | null; cargando: boolean }`, una sola carga al montar con el patrón `void Promise.resolve().then(...)` del repo.

Layout, mismo lenguaje visual que `src/app/monitoreo/page.tsx` (`flex min-h-dvh flex-col gap-3 p-4`):
- Header: `Logo size={24} wordmark={false}`, `h1` con `detalle.titulo` en el estilo `text-sm font-medium tracking-[0.12em] uppercase` y al lado el nombre del invernadero; a la derecha (`ml-auto`) `Button variant="outline" size="sm"` → `/monitoreo` con `ArrowLeftIcon` y `detalle.volver`.
- Cuerpo, en orden de prioridad:
  - cargando → `cargando`
  - error → `detalle.noEncontrado` (Review Focus 2)
  - sin dispositivos con `influxId` → `detalle.sinInflux` + link `verInvernadero` a `/invernaderos/${id}` (Review Focus 3)
  - si no → `<MonitoreoPanel invernadero={data} number="01" dispositivoInicial={dispositivo ?? undefined} />`

- [ ] **Step 5: Verificar tipos y lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add src/app/monitoreo/[id]/page.tsx src/components/monitoreo/MonitoreoPanel.tsx src/components/shared/AuthGate.tsx messages/es/pages.json messages/en/pages.json
git commit -m "monitoreo: pagina de monitoreo por invernadero"
```

---

### Task 2: Botón "Monitoreo" en la tarjeta de equipo + verificación

**Files:**
- Modify: `src/components/monitoreo/vista/EquipoCard.tsx` (footer, ~línea 170)

**Interfaces:**
- Consumes: ruta `/monitoreo/[id]?dispositivo=` de la Task 1; `invernadero._id` y `equipo.dispositivoId` (ya son props de `EquipoCard`); clave `pages.monitoreo.verMonitoreo`.

- [ ] **Step 1: Agregar el botón al footer**

Dentro del `<footer>` que ya se renderiza solo con `conexion !== "sin_influx"` (sin Influx no hay gráficos que ver; esas tarjetas ya muestran el link "Ver invernadero"): al final, `Button variant="outline" size="xs" className="ml-auto font-sans"` con `render={<Link href={\`/monitoreo/${invernadero._id}?dispositivo=${equipo.dispositivoId}\`} />}`, `ChartLineIcon aria-hidden="true"` y texto `t("verMonitoreo")`. El footer tiene `items-center` agregado si hace falta para alinear el botón con los datos.

- [ ] **Step 2: Tipos y lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sin errores.

- [ ] **Step 3: Suite**

Run: `npm test`
Expected: todo pasa (no hay tests nuevos; confirma que nada se rompió).

- [ ] **Step 4: Verificación en el navegador**

`npm run dev:agent` (3099). En `cultivo_hongos_agent`: registrar usuario, crear un invernadero con dos dispositivos con `influxId` reales (los de `.env.local`/Influx) y otro invernadero sin `influxId`. Chequear:
- `/monitoreo`: cada tarjeta con Influx tiene el botón; la de "sin Influx" no.
- Click en el botón del segundo equipo → `/monitoreo/<id>?dispositivo=<id2>`, sin sidebar, con ese equipo elegido en el selector, gráficos cargando.
- Review Focus 1: `?dispositivo=basura` → primer equipo.
- Review Focus 2: `/monitoreo/000000000000000000000000` → "No se encontró el invernadero."
- Review Focus 3: `/monitoreo/<id del invernadero sin influx>` → aviso `sinInflux`.
- Review Focus 4: `/monitoreo` sigue sin marco; sin sesión (borrar sesión) → `/login`.
- Review Focus 5: ventana a 375 px → sin scroll horizontal.
- Botón "Vista en vivo" vuelve a `/monitoreo`.

Al terminar: `npm run db:reset-agent`.

- [ ] **Step 5: Commit**

```bash
git add src/components/monitoreo/vista/EquipoCard.tsx
git commit -m "monitoreo: boton de monitoreo en cada equipo de la vista en vivo"
```
