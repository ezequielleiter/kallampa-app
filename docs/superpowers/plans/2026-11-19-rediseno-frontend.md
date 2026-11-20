# Rediseño del frontend (visual + código) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el mundo visual actual de Kallampa por uno nuevo definido con impeccable y, sección por sección, dejar el código del front más chico, más testeable y alineado con las prácticas de modern-web-guidance.

**Architecture:** Primero se fija la base: el contexto del producto (`PRODUCT.md`), el nuevo mundo visual (`DESIGN.md`) y los tokens. Después, el shell de la app y las primitivas compartidas. Recién entonces se migra una sección por tarea. Se mantiene la arquitectura de tokens en dos capas (`src/styles/kallampa/tokens.css`: primitivos → semánticos) y el puente de nombres con shadcn en `src/app/globals.css`, así cada tarea cambia valores sin romper a los componentes que todavía no migraron. La lógica que hoy vive dentro de componentes grandes se extrae a módulos `.ts` puros con test de Vitest (el mismo patrón que `src/components/batch/lote-view.ts`).

**Tech Stack:** Next.js 16.3 (App Router; leer `node_modules/next/dist/docs/` antes de tocar APIs de Next), React 19.2, Tailwind 4 (`@theme inline`), shadcn `base-nova` sobre `@base-ui/react`, Phosphor icons, next-intl (`messages/es`, `messages/en`), Recharts, Vitest (entorno `node`, sin DOM).

**Spec:** No hay spec escrita. Este plan parte de lo que decidió el usuario el 2026-11-19: (1) rediseño visual **y** refactor de código, (2) usar las skills `impeccable` y `modern-web-guidance`, (3) trabajar directo sobre `main`, sin rama. La dirección visual concreta la fijan `PRODUCT.md` y `DESIGN.md`, que se escriben en las Tareas 1 y 2 con aprobación del usuario. Desde ahí, esos dos archivos son la spec de todas las tareas siguientes.

## Global Constraints

- Rama: `main`. Un commit por tarea. **No hacer push sin que el usuario lo pida.** Un push a la rama de producción es un deploy, sin previews. Ojo: `DEPLOY.md` dice `master`, pero el remoto es `origin/main`. Confirmar con el usuario cuál despliega Vercel antes del primer push.
- Para correr la app, usar siempre `npm run dev:agent` (puerto 3099, base `cultivo_hongos_agent`). Nunca `npm run dev`, nunca la base `cultivo_hongos`. Si hacen falta datos de prueba, sembrarlos en `cultivo_hongos_agent` (y `npm run db:reset-agent` para limpiarla).
- impeccable: correr `"<skill-dir>/scripts/impeccable" context` una vez por sesión y leer `reference/craft-floor.md` **antes de cualquier edición de UI**. El panel es modo **Operate**; la landing (`src/components/landing`) es modo **Persuade**.
- modern-web-guidance: antes de escribir UI, `npx -y modern-web-guidance@latest retrieve "<ids>"` con los ids que lista cada tarea, y respetar sus fallbacks para lo que no es Baseline Widely available. Al cerrar cada tarea, agregar la sección `### Modern Web Guidance` que pide la skill.
- i18n: todo texto nuevo va en `messages/es/*.json` **y** `messages/en/*.json` con la misma clave. Nada de texto literal en JSX.
- No se agregan dependencias nuevas salvo que `DESIGN.md` lo pida explícitamente (por ejemplo, una fuente vía `next/font`).
- No se cambian contratos de API, modelos ni rutas (`src/app/api`, `src/models`, `src/lib/types.ts`), salvo un refactor puro en `src/lib`.
- Verificación de cada tarea: `npx tsc --noEmit`, `npm run lint` y `npm test` en verde, y capturas con `impeccable shot` de cada ruta tocada a 1440px y a 360px.

## Review Focus

1. **Teléfono (360px):** hoy la sidebar es fija (`w-(--sidebar-width)`, `h-dvh`). Ninguna ruta puede tener scroll horizontal y la navegación tiene que ser usable con el pulgar. Lo prueba la Tarea 4 y se re-chequea con `shot` en cada sección.
2. **Paridad de traducciones es/en:** el rediseño agrega o mueve textos, y una clave que falta rompe en runtime. Lo prueba el test de paridad de la Tarea 3.
3. **Estados vacío / cargando / error:** listas vacías, la API caída, Influx sin configurar (`503 influx_no_configurado`). Con datos sembrados la sección se ve bien y sin datos queda rota. Cada sección se revisa con `cultivo_hongos_agent` vacía (`db:reset-agent`) y con datos.
4. **Teclado y foco:** diálogos y sheets con foco atrapado y devuelto, `:focus-visible` en todo control, Enter seguro con IME (hallazgo de `legacy-scan` en `VentaFormDialog.tsx:389`). Lo prueban la Tarea 5 (primitivas) y la Tarea 8 (IME).
5. **Colores fuera de tokens:** literales en `style={{}}` (hay 32) y en los gráficos (Recharts, `monitoreo/BarChart.tsx`) que no siguen el tema nuevo, y `color-scheme` de los inputs de fecha. La Tarea 3 agrega un chequeo con grep y cada sección deja su parte en cero.

---

### Task 0: Preparación y línea base

**Files:**
- Create: `docs/superpowers/redesign/baseline/` (capturas)

- [ ] **Step 1:** El usuario instala impeccable: `/plugin install impeccable@impeccable` y después `/reload-plugins`. Verificar que aparezca la skill `impeccable:impeccable`.
- [ ] **Step 2:** Correr `npx tsc --noEmit && npm run lint && npm test`. Esperado: todo en verde. Si algo ya falla, anotarlo acá antes de seguir: no es regresión del rediseño.
- [ ] **Step 3:** Levantar `npm run dev:agent`, sembrar en `cultivo_hongos_agent` un usuario y al menos un lote con recipientes, una clonación, un invernadero, una venta y una nota. Capturar con `impeccable shot` cada ruta de `NAV_LINKS` más `/login`, `/registro` y `/`, a 1440px y 360px, en `docs/superpowers/redesign/baseline/`.
- [ ] **Step 4:** Commit: `git add docs/superpowers/redesign && git commit -m "rediseño: capturas de línea base"`

### Task 1: Contexto de producto (`PRODUCT.md`)

**Files:**
- Create: `PRODUCT.md` (lo escribe `impeccable init`)

- [ ] **Step 1:** Correr `/impeccable init`. Contestar la entrevista con el usuario, no inventar. Partir de lo que se sabe: Kallampa gestiona cultivos de hongos (producción por lotes, micelio y clonación, invernaderos con monitoreo, calendario, trazabilidad, ventas, herramientas). Se usa a diario en el galpón, a menudo desde el teléfono, y la UI está en español con inglés secundario. Plataforma: web.
- [ ] **Step 2:** **Checkpoint con el usuario:** revisa `PRODUCT.md` y lo aprueba o lo corrige.
- [ ] **Step 3:** Commit: `git add PRODUCT.md && git commit -m "rediseño: PRODUCT.md"`

### Task 2: Nuevo mundo visual (`DESIGN.md` + tokens)

**Files:**
- Create: `DESIGN.md`
- Modify: `src/styles/kallampa/tokens.css` (todo el archivo), `src/styles/kallampa/motion.css`, `src/app/layout.tsx` (fuente y `data-theme`)

**Interfaces:**
- Produces: el mismo conjunto de nombres de variables semánticas que existe hoy (`--surface-page|card|inset|selected|overlay`, `--text-strong|body|muted|subtle|accent`, `--status-*`, `--shadow-sm|md|lg`, `--color-accent*`, `--color-neutral-*`, `--color-danger*`), con valores nuevos. Si `DESIGN.md` necesita un rol nuevo, se **agrega** acá y en el puente `@theme inline` de `globals.css`. No se renombra ninguno que ya exista, porque las tareas 4 a 11 cuentan con esos nombres hasta migrar.

- [ ] **Step 1:** Seguir `impeccable` → `reference/new-work.md` + `reference/new-work-world.md`, tratando el look actual como evidencia y anti-referencia ("Redesign replaces"). Antes de elegir, retrieve de los guides `typography,fluid-scaling,respect-os-text-scale,dark-mode,dark-mode-toggle`.
- [ ] **Step 2:** **Checkpoint con el usuario:** presentarle la dirección (paleta, tipografía, densidad, radios, elevación y si hay tema claro además del oscuro) aplicada en una sola pantalla de referencia (`/lotes`), con `shot` a 1440 y 360. No se avanza sin su aprobación. Si se suma un tema claro, definirlo como un segundo bloque de primitivos bajo `[data-theme="…"]`, como prevé `tokens.css`.
- [ ] **Step 3:** Escribir `DESIGN.md` con lo aprobado y reescribir `tokens.css` y `motion.css`. Cambiar la fuente en `layout.tsx` (`next/font`, variable `--font-brand`).
- [ ] **Step 4:** `npx tsc --noEmit && npm run lint && npm test` en verde. `shot` de todas las rutas: todo tiene que verse con los colores nuevos aunque el layout sea el viejo.
- [ ] **Step 5:** Commit: `git commit -am "rediseño: DESIGN.md y tokens del nuevo mundo visual"` (incluir `DESIGN.md` con `git add`).

### Task 3: Base global (CSS base, chequeos automáticos)

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/lib/messages-parity.test.ts`
- Create: `scripts/check-literal-colors.sh`

**Interfaces:**
- Produces: `scripts/check-literal-colors.sh <ruta>`, que termina con código distinto de 0 e imprime `archivo:línea` si encuentra `#[0-9a-fA-F]{3,8}`, `rgb(` u `oklch(` en `.tsx` fuera de `src/components/landing`. Las tareas de sección lo usan como verificación.

- [ ] **Step 1: Test de paridad que falla primero.** En `src/lib/messages-parity.test.ts`: aplanar las claves de cada `messages/{es,en}/<archivo>.json`. Tests:
  - `it("cada clave de es existe en en", …)`: para los 4 archivos, `expect(faltantesEnEn).toEqual([])`.
  - `it("cada clave de en existe en es", …)`: para `common.json`, `components.json` y `pages.json`, `expect(faltantesEnEs).toEqual([])`. `errors.json` queda fuera: hoy `en` tiene 120 claves más que `es` a propósito, y el `es` le gana. Dejar comentado ese motivo.
  Correr `npx vitest run src/lib/messages-parity.test.ts`. Hoy tiene que **pasar**: es un guardián, no un bug. Para confirmar que funciona, borrar temporalmente una clave de `en/common.json`, verlo fallar y restaurarla.
- [ ] **Step 2:** Retrieve de `accessibility,css-layout,forms` y reescribir el `@layer base` de `globals.css` según `DESIGN.md`: tamaño base (hoy `14px` fijo; respetar la escala de texto del sistema según `respect-os-text-scale`), `:focus-visible` con el token de foco, y `color-scheme` de los inputs de fecha derivado del tema y no fijo en `dark`. Eliminar del puente `@theme inline` lo que `DESIGN.md` haga obsoleto (por ejemplo, la escalera de radios que hoy colapsa todo a `14px`). Borrar `glow-page` y `rule-fade` solo si `grep -r` confirma que nadie los usa.
- [ ] **Step 3:** Escribir `scripts/check-literal-colors.sh` (grep + exit code). Correrlo sobre `src` y guardar el conteo inicial en el mensaje de commit: es la deuda que bajan las tareas 4 a 11.
- [ ] **Step 4:** `npx tsc --noEmit && npm run lint && npm test` en verde. Commit: `git commit -m "rediseño: base CSS global, test de paridad i18n y chequeo de colores literales"`

### Task 4: Shell de la app (sidebar, header, auth)

**Files:**
- Modify: `src/components/shared/Sidebar.tsx`, `Header.tsx`, `Breadcrumbs.tsx`, `AuthShell.tsx`, `AuthGate.tsx`, `AccountSettingsDialog.tsx`, `nav.ts`
- Modify: `src/app/login/page.tsx`, `src/app/registro/page.tsx`
- Test: `src/components/shared/nav.test.ts`

**Interfaces:**
- Consumes: tokens de la Tarea 2.
- Produces: `navLinkForPath(pathname: string | null)` sin cambio de firma. Si `DESIGN.md` agrupa la navegación, agregar en `nav.ts` `NAV_GROUPS: { key: NavGroupKey; links: NavLink[] }[]` y exportar `type NavLink = (typeof NAV_LINKS)[number]`.

- [ ] **Step 1: Tests.** En `nav.test.ts`: `navLinkForPath("/lotes/abc")?.href === "/lotes"`; `navLinkForPath("/notas/nueva")?.href === "/notas"`; `navLinkForPath(null) === undefined`; `navLinkForPath("/lotesx") === undefined` (hoy **falla**: el `startsWith` matchea un prefijo sin `/`); si hay `NAV_GROUPS`, que el conjunto de hrefs agrupados sea igual al de `NAV_LINKS`.
- [ ] **Step 2:** Correr `npx vitest run src/components/shared/nav.test.ts`. Esperado: falla en `/lotesx`.
- [ ] **Step 3:** Arreglar `navLinkForPath` para que matchee `pathname === href || pathname.startsWith(href + "/")`.
- [ ] **Step 4:** Retrieve de `navigation-drawer,navbar,responsive-design`. Rediseñar el shell según `DESIGN.md`: en pantallas angostas, la sidebar pasa a un drawer (o una barra inferior, si así lo decidió `DESIGN.md`) con el `Sheet` existente de `src/components/ui/sheet.tsx`; en anchas queda como columna. Header y breadcrumbs se ajustan al nuevo tipo. Login y registro (`AuthShell`) también.
- [ ] **Step 5:** `npm test` en verde. `shot` de `/lotes`, `/login` y `/registro` a 1440 y 360: a 360 sin scroll horizontal y con el menú abriendo, cerrando y devolviendo el foco. `scripts/check-literal-colors.sh src/components/shared` en 0.
- [ ] **Step 6:** Commit: `git commit -m "rediseño: shell responsive (sidebar/drawer, header, auth)"`

### Task 5: Primitivas compartidas (`ui/` y `kallampa/`)

**Files:**
- Modify: `src/components/ui/*.tsx` (15 archivos), `src/components/kallampa/*.tsx` (14 archivos)

**Interfaces:**
- Produces: las mismas props y exports que hoy en cada primitiva. Las secciones ya las consumen, así que esta tarea cambia el aspecto, no la API. Una variante nueva que pida `DESIGN.md` se agrega con `cva` sin quitar las existentes.

- [ ] **Step 1:** Retrieve de `dialog,prevent-page-scroll-under-modal-dialog,light-dismiss-a-dialog,responsive-table,validate-input-after-interaction,forms,accessibility`. Los diálogos, sheets, selects y menús siguen sobre `@base-ui/react`: aplicar lo del guide que base-ui no cubre (por ejemplo, el bloqueo de scroll y el retorno del foco), sin reescribirlos con `<dialog>` nativo.
- [ ] **Step 2:** Correr `impeccable extract src/components` para comparar las primitivas actuales con `DESIGN.md`, y restilizar `button`, `input`, `textarea`, `select`, `label`, `badge`, `card`, `table`, `tabs`, `dialog`, `alert-dialog`, `sheet`, `dropdown-menu`, `separator`, `sonner`, y después los de `kallampa/` (`Field`, `PageHeader`, `SectionCard`, `Kpi`, `StatusTag`, `SegmentedControl`, `ChoiceList`, `Stepper`, `ProgressDays`, `PendingList`, `CostBreakdown`, `StateSelect`, `Logo`).
- [ ] **Step 3:** `Table` responsive según `responsive-table`, con la estrategia que fije `DESIGN.md` (scroll contenido en su caja o filas apiladas), para que ninguna tabla genere scroll de página a 360px.
- [ ] **Step 4:** `impeccable audit src/components/ui src/components/kallampa` y corregir lo que reporte. `check-literal-colors.sh` sobre ambas carpetas en 0. `tsc`, `lint` y `test` en verde.
- [ ] **Step 5:** Commit: `git commit -m "rediseño: primitivas ui y kallampa al nuevo sistema"`

---

**Patrón de las tareas de sección (6 a 11).** Cada una hace, en este orden:
(a) Tests de la lógica que se extrae: primero fallan, porque el módulo no existe.
(b) Extraer la lógica a un `.ts` puro junto a los componentes y partir los archivos de más de ~250 líneas en subcomponentes de una sola responsabilidad, sin cambiar el comportamiento.
(c) Leer `craft-floor.md` y rediseñar la sección con las primitivas de la Tarea 5 y `DESIGN.md`.
(d) Corregir los hallazgos de `legacy-scan` que caen en la sección.
(e) Correr `impeccable audit <ruta>` y `impeccable polish <ruta>`.
(f) Verificar con `shot` a 1440 y 360, con `cultivo_hongos_agent` vacía y con datos. `check-literal-colors.sh <carpetas>` en 0, y `tsc`, `lint` y `test` en verde.
(g) Commit.

### Task 6: Producción (lotes)

**Files:**
- Modify: `src/app/lotes/page.tsx`, `src/app/lotes/nuevo/page.tsx` (327 líneas), `src/app/lotes/[id]/page.tsx`, `src/components/batch/*.tsx`
- Modify: `src/components/batch/lote-view.ts:99`, `CosechaSection.tsx:89`, `OleadaFormDialog.tsx:68`
- Create: `src/components/batch/nuevo-lote.ts`
- Test: `src/components/batch/nuevo-lote.test.ts`, `src/components/batch/lote-view.test.ts` (ya existe)

**Interfaces:**
- Produces: `frascoLiquidoHongoNombre(f: FrascoLiquido): string` (se mueve desde `lotes/nuevo/page.tsx:35`) y la validación del formulario de nuevo lote como `validarNuevoLote(input): Partial<Record<keyof input, string>>`. Las claves de error son claves de `messages/*/errors.json`, no texto.

- [ ] **Step 1:** Tests en `nuevo-lote.test.ts` para `frascoLiquidoHongoNombre` (frasco con y sin hongo poblado) y para `validarNuevoLote` (origen `"hongo"` sin hongo → error; origen `"frascoLiquido"` sin frasco → error; input completo → `{}`). Correr y verlos fallar.
- [ ] **Step 2:** Implementar `nuevo-lote.ts` moviendo la lógica que ya está en la página, que pasa a importarla. Correr y verlos pasar.
- [ ] **Step 3:** Reemplazar las tres copias-y-ordená (`[...x].sort(…)`) por `x.toSorted(…)`, según `js/copying-array-methods`. `lote-view.test.ts` sigue en verde.
- [ ] **Step 4:** Rediseño de la lista, de nuevo y del detalle (`BatchHeader`, `JarsGrid`, `RecipientesTable`, secciones de fructificación y cosecha, receta, comentarios, trazabilidad, ventas del lote, pendientes) según el patrón (c)–(f). `LoteRecetaSustrato.tsx` (389) se parte: el formulario (`RecetaForm`, `FilaCantidad`) va a `LoteRecetaSustratoForm.tsx`, y `realesDesde`/`iguales` a `receta-sustrato-view.ts` con tests (`iguales` con cantidades iguales y distintas; `realesDesde` formatea según el locale `es` y `en`).
- [ ] **Step 5:** Commit: `git commit -m "rediseño: producción (lotes) + extracción de lógica"`

### Task 7: Micelio (clonación)

**Files:**
- Modify: `src/app/clonacion/page.tsx`, `src/app/clonacion/nueva/page.tsx` (504), `src/app/clonacion/[id]/page.tsx`, `src/components/clonacion/*`
- Create: `src/components/clonacion/nueva-clonacion.ts`
- Test: `src/components/clonacion/nueva-clonacion.test.ts`

**Interfaces:**
- Produces: `nuevaClonacionSchema` (zod, se mueve desde `nueva/page.tsx`), `type NuevaClonacionInput`, `type OrigenProceso = "placa" | "comprado" | "frascoGrano"` y `todayInputValue(now?: Date): string`, que devuelve `YYYY-MM-DD` local.

- [ ] **Step 1:** Tests: `nuevaClonacionSchema.safeParse` acepta un input válido por cada `OrigenProceso` y rechaza cada uno al que le falta su campo obligatorio. `todayInputValue(new Date(2026, 0, 5)) === "2026-01-05"` (local, no UTC). Verlos fallar.
- [ ] **Step 2:** Mover schema y helpers a `nueva-clonacion.ts`. Partir `NuevaClonacionForm` en un subcomponente por origen (`OrigenPlacaFields`, `OrigenCompradoFields`, `OrigenFrascoGranoFields`) dentro de `src/components/clonacion/`. Tests en verde.
- [ ] **Step 3:** Rediseño de las tres rutas, patrón (c)–(f).
- [ ] **Step 4:** Commit: `git commit -m "rediseño: micelio (clonación) + extracción de lógica"`

### Task 8: Ventas

**Files:**
- Modify: `src/app/ventas/page.tsx` (661), `src/components/ventas/VentaFormDialog.tsx` (607), `MermaFormDialog.tsx`, `ClienteFormDialog.tsx`
- Create: `src/components/ventas/VentasTab.tsx`, `StockTab.tsx`, `ClientesTab.tsx`, `venta-form.ts`
- Test: `src/components/ventas/venta-form.test.ts`

**Interfaces:**
- Produces: en `venta-form.ts`: `interface Fila`, `type ErroresFila`, `interface Errores` (se mueven desde el diálogo), `validarVenta(filas: Fila[], …): Errores` (la validación que hoy está inline en `VentaForm`), y `leerUltimoPrecio(storage?: Storage): number | null` / `guardarUltimoPrecio(n: number, storage?: Storage): void`, con try/catch, que devuelven `null` si el storage tira error o no existe.
- `page.tsx` queda como orquestador de las tabs `"ventas" | "stock" | "clientes"`. Cada tab recibe por props lo que hoy lee del estado de la página.

- [ ] **Step 1:** Tests: `validarVenta` (fila sin lote → `lote`; kg ≤ 0 → `kg`; precio vacío → `precio`; filas válidas → sin errores); `leerUltimoPrecio` con un storage falso que devuelve `"123"` → `123`, que devuelve basura → `null`, y que tira error → `null`. Verlos fallar.
- [ ] **Step 2:** Implementar `venta-form.ts` y hacer que el diálogo lo use. Tests en verde.
- [ ] **Step 3:** Retrieve de `ime-safe-enter-submit` y arreglar `VentaFormDialog.tsx:389`: ignorar el Enter si `e.nativeEvent.isComposing || e.keyCode === 229`.
- [ ] **Step 4:** Partir `ventas/page.tsx` en las tres tabs y rediseñar, patrón (c)–(f). Revisar con `/ventas` sin ventas ni clientes (estado vacío).
- [ ] **Step 5:** Commit: `git commit -m "rediseño: ventas, tabs separadas, validación testeada y Enter seguro con IME"`

### Task 9: Invernaderos y monitoreo

**Files:**
- Modify: `src/app/invernaderos/page.tsx`, `src/app/invernaderos/[id]/page.tsx`, `src/components/invernaderos/*`, `src/components/monitoreo/*` (incluye `BarChart.tsx`, `MonitoreoPanel.tsx`)
- Modify: `src/lib/monitoreo/ciclos.ts:52`

- [ ] **Step 1:** `ciclos.ts:52` → `rowsIn.toSorted((a, b) => a.t - b.t)`. Sus tests existentes en `src/lib/monitoreo` siguen en verde.
- [ ] **Step 2:** Cargar la skill `dataviz` antes de tocar gráficos. Los colores de las series y los ejes salen de tokens (`var(--…)`), no de literales, y se ven bien en todos los temas de `DESIGN.md`.
- [ ] **Step 3:** Rediseño, patrón (c)–(f). Revisar sí o sí el estado `503 influx_no_configurado`: `dev:agent` corre sin variables `INFLUX_*`, así que ese estado se ve tal cual.
- [ ] **Step 4:** Commit: `git commit -m "rediseño: invernaderos y monitoreo"`

### Task 10: Calendario, trazabilidad y notas

**Files:**
- Modify: `src/app/calendario/page.tsx`, `src/components/calendario/*`, `src/app/trazabilidad/page.tsx` (403), `src/app/notas/**`, `src/components/notas/*`
- Create: `src/components/trazabilidad/TraceNode.tsx` (con `NodeMeta`, que se mueven desde la página)

- [ ] **Step 1:** Mover `TraceNode` y `NodeMeta` fuera de `trazabilidad/page.tsx`. Si la página tiene lógica de armado del árbol, extraerla a `src/components/trazabilidad/trazabilidad-view.ts` con un test por cada tipo de nodo que arma.
- [ ] **Step 2:** Rediseño de las tres secciones, patrón (c)–(f). El editor de notas (Tiptap) tiene que tomar la tipografía de `DESIGN.md` (`@tailwindcss/typography` / `prose`).
- [ ] **Step 3:** Commit: `git commit -m "rediseño: calendario, trazabilidad y notas"`

### Task 11: Identificador, inventario, estadísticas y herramientas

**Files:**
- Modify: `src/app/identificador/page.tsx`, `src/app/inventario/page.tsx`, `src/components/catalogs/*`, `src/app/estadisticas/page.tsx`, `src/components/stats/*`, `src/app/herramientas/page.tsx`, `src/components/herramientas/*`

- [ ] **Step 1:** Rediseño, patrón (c)–(f). Para estadísticas, usar la skill `dataviz`, igual que en la Tarea 9. Las calculadoras de herramientas ya tienen su lógica en `src/lib`: no duplicarla.
- [ ] **Step 2:** Commit: `git commit -m "rediseño: identificador, inventario, estadísticas y herramientas"`

### Task 12: Landing (modo Persuade)

**Files:**
- Modify: `src/components/landing/*` (incluye `landing.css`), `src/app/page.tsx`

- [ ] **Step 1:** **Checkpoint con el usuario:** ¿la landing entra en el rediseño y con qué ambición? Es otro modo (Persuade) y en `TODO.md` muestra funciones que el panel no tiene. Si queda afuera, saltear esta tarea.
- [ ] **Step 2:** Si entra: `impeccable` → `new-work.md` en modo Persuade, sobre el mismo `DESIGN.md`. Retrieve de `cross-document-transitions` y `fluid-scaling` si `DESIGN.md` los pide. La landing puede tener colores propios en `landing.css`, que es la excepción del chequeo de literales.
- [ ] **Step 3:** Commit: `git commit -m "rediseño: landing"`

### Task 13: Cierre

**Files:**
- Modify: `TODO.md` (referencias al DS viejo), `DESIGN.md` (lo que cambió durante la implementación)

- [ ] **Step 1:** `npx -y modern-web-guidance@latest legacy-scan src --json`. Esperado: 0 hallazgos reales (descartar falsos positivos con su rúbrica `keepWhen`/`dropWhen`).
- [ ] **Step 2:** `scripts/check-literal-colors.sh src` en 0.
- [ ] **Step 3:** `/impeccable critique` sobre `/lotes`, `/ventas` y `/invernaderos/[id]`, y `/impeccable audit` sobre toda la app. Corregir lo que reporten.
- [ ] **Step 4:** Capturas finales de todas las rutas a 1440 y 360 en `docs/superpowers/redesign/final/`, al lado de las de `baseline/`.
- [ ] **Step 5:** `npx tsc --noEmit && npm run lint && npm test && npm run build`, todo en verde.
- [ ] **Step 6:** Commit: `git commit -m "rediseño: cierre, auditoría final y capturas"`. **No hacer push:** preguntarle al usuario.
