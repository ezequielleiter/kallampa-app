# Figura en vivo del invernadero (modelo `kallampa_fructificacion_1`) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Los invernaderos tienen un campo "modelo de invernadero". Si es `kallampa_fructificacion_1`, la página `/monitoreo/[id]` muestra un dibujo isométrico del invernadero armado (skill `anatomy`). En ese dibujo se ve en vivo el vapor que sale del codo de PVC cuando el humidificador está prendido, y el aire que sale por el extractor cuando está prendido.

**Architecture:**
- **Datos:** el estado sale del mismo lugar que la vista en vivo. El equipo se consulta cada 3 s si está en la red local (`useEnVivo`); si no, se usa el último `estado` de InfluxDB (`/api/monitoreo/resumen`, cada 60 s). Esa lógica, que hoy está escrita adentro de `src/app/monitoreo/page.tsx`, se saca a un hook compartido.
- **Dibujo:** sigue el camino React/Next de la skill `anatomy`. El kit se copia a `src/components/iso/`. La geometría es TypeScript puro y se arma en un componente de servidor. Un único componente `"use client"` anima el rotor de la turbina, maneja una capa WebGL para el vapor y el aire, y tiene un respaldo en SVG por si no hay WebGL.
- **Página:** `/monitoreo/[id]` pasa a ser un componente de servidor que le entrega el arte al cliente.
- **Rediseño:** la pantalla de monitoreo se rediseña con la skill `impeccable`.

**Tech Stack:** Next.js del repo (leer `node_modules/next/dist/docs/` antes de tocar páginas o el límite servidor/cliente), React, next-intl, Mongoose, Zod, Vitest (entorno `node`), kit de `anatomy` (`/home/ezequielleiter/.claude/skills/anatomy`), WebGL.

**Spec:** el pedido del usuario del 2026-11-27, más sus respuestas. No hay archivo de spec aparte. Lo que vale:
- **Colección:** la colección `invernaderos` suma el campo "modelo de invernadero". El primer modelo es `kallampa_fructificacion_1`.
- **Medidas** (`image.png` en la raíz del repo, modelo INV-2.1M-PVC): 143 cm de frente, 195 cm de fondo y 215 cm de alto. Caño de Ø16 mm. Malla de los estantes de 3,3 × 7,2 cm.
- **Ubicación de los equipos, mirando de frente:**
  - **Humidificador:** adelante a la izquierda, **en el piso**. Sube un caño de PVC con un codo que larga el vapor a **~1,2 m**.
  - **Extractor:** **turbina en línea** (cuerpo cilíndrico metido en un conducto) **abajo a la derecha, contra la pared del fondo**. Chupa aire de adentro y el conducto atraviesa el plástico del fondo hacia afuera.
  - **Sensor:** en el medio.
- **Cobertura:** **plástico translúcido** en todos los paños.
- **Versión completa:** vapor y aire con WebGL, con respaldo en SVG.
- **Diseño:** usar `/impeccable` para la UI/UX de la pantalla de monitoreo nueva.

## Global Constraints

- **Valor del modelo:** el único valor es `kallampa_fructificacion_1`, definido una sola vez en `src/lib/invernadero-modelos.ts` como `MODELOS_INVERNADERO = ["kallampa_fructificacion_1"] as const`. El campo se llama `modelo`, es opcional y `null` en el PATCH lo borra.
- **Textos:** todos van en `messages/es/*.json` y `messages/en/*.json`.
- **Unidades del dibujo:** 1 unidad = 1 cm real. Ejes: x = ancho del frente (0–143, de izquierda a derecha mirando de frente), y = fondo (0 = frente, 195 = fondo), z = alto.
- **Tema:** la app solo tiene tema oscuro (`data-theme="kallampa-dark"`). El dibujo y los shaders se hacen solo para oscuro; no hay tema claro que mantener.
- **El dibujo nunca inventa estado:** sin dato vigente no hay vapor ni aire. Ver la regla de `estadoFigura` en la Task 3.
- **Sin dependencias npm nuevas.** El kit se copia como código fuente.
- **Para levantar la app:** `npm run dev:agent` (puerto 3099, base `cultivo_hongos_agent`). Nunca `npm run dev` ni la base `cultivo_hongos`.

## Review Focus

1. **Invernadero sin `modelo`, o con un modelo sin figura registrada:** la página queda igual que hoy (tarjeta y gráficos), sin hueco ni error.
2. **Equipo desconectado o sin datos, con el último `estado` diciendo `hum_on=true`:** no hay vapor. El dibujo queda quieto y el texto de estado dice "Sin datos en vivo del equipo". Animar con un dato viejo es mentirle al productor.
3. **Navegador sin WebGL, o contexto WebGL perdido:** se ven el respaldo SVG (volutas de vapor y aire) y el rotor girando. No hay errores en la consola.
4. **`prefers-reduced-motion`:** cuadro quieto. El estado se sigue leyendo: volutas estáticas si está prendido y el texto de estado actualizado.
5. **Invernadero con dos equipos:** la figura y la tarjeta siguen al equipo elegido en el selector del panel de gráficos, no siempre al primero.

Cada uno tiene su chequeo en la Task 5, Step 6. El 2 además tiene test unitario en la Task 3.

---

### Task 1: Campo `modelo` en invernaderos

**Files:**
- Create: `src/lib/invernadero-modelos.ts`
- Modify: `src/models/Invernadero.ts` (interfaz y schema, junto a `precioKwh`)
- Modify: `src/lib/validations/invernadero.schema.ts` (`createInvernaderoSchema`, `updateInvernaderoSchema`)
- Modify: `src/lib/types.ts` (`Invernadero`)
- Modify: `src/components/invernaderos/InvernaderoFormDialog.tsx`
- Modify: `messages/es/components.json`, `messages/en/components.json` (bloque del formulario de invernadero)
- Test: `src/app/api/invernaderos/route.test.ts`

**Interfaces:**
- Produces: `MODELOS_INVERNADERO`, `type ModeloInvernadero = (typeof MODELOS_INVERNADERO)[number]`; `Invernadero.modelo?: ModeloInvernadero` en `src/lib/types.ts`.

- [ ] **Step 1: Escribir el test que falla**

En `route.test.ts`, al lado de `"guarda, edita y borra el precio del kWh"`, agregar `it("guarda, valida y borra el modelo de invernadero")`:
- POST con `modelo: "kallampa_fructificacion_1"` da 201 y `json.data.modelo === "kallampa_fructificacion_1"`.
- PATCH con `modelo: "otro"` da 400.
- PATCH con `modelo: null` da 200, `json.data.modelo` queda `undefined` y `nombre` no cambia.
- POST sin `modelo` da 201 y `modelo` queda `undefined`.

- [ ] **Step 2: Correr el test y verlo fallar**

Run: `npx vitest run src/app/api/invernaderos/route.test.ts`
Expected: falla el test nuevo (se ignora `modelo`).

- [ ] **Step 3: Implementar**

- Zod: `z.enum(MODELOS_INVERNADERO, "modelo_invalido:Modelo de invernadero inválido")`, `.optional()` en el create y `.nullable().optional()` en el update. El `$unset` con `null` del PATCH ya existe; no tocarlo.
- Mongoose: `modelo: { type: String, enum: MODELOS_INVERNADERO }`.
- Formulario: un `Select` (el de `src/components/ui/select.tsx`, usado igual que en `EditarLoteDialog.tsx`) con la opción "Sin modelo" (manda `null`) más una opción por modelo.

| clave | es | en |
|---|---|---|
| `modelo` | `Modelo de invernadero` | `Greenhouse model` |
| `modeloNinguno` | `Sin modelo` | `No model` |
| `modeloHint` | `Si coincide con uno armado, se ve el dibujo en vivo en el monitoreo.` | `If it matches a built one, the live drawing shows in monitoring.` |
| `modelos.kallampa_fructificacion_1` | `Kallampa fructificación 1` | `Kallampa fruiting 1` |

Si el código `modelo_invalido` no se traduce solo, sumarlo a `src/lib/error-messages.ts`.

- [ ] **Step 4: Correr el test y verlo pasar**

Run: `npx vitest run src/app/api/invernaderos/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "invernaderos: campo modelo de invernadero"`, con todos los archivos de la task.

---

### Task 2: Hook compartido `useResumenEnVivo`

**Files:**
- Create: `src/components/monitoreo/vista/useResumenEnVivo.ts`
- Modify: `src/app/monitoreo/page.tsx` (sacar a este hook la carga, el refresco, `useEnVivo` y `mezclar`; la vista no cambia)

**Interfaces:**
- Produces:
  ```ts
  useResumenEnVivo(): {
    resumen: ResumenMonitoreo | null;   // con lo del equipo en vivo ya aplicado (aplicarVivo)
    error: string | null;
    at: number | null;                  // epoch ms de la ultima carga ok
    ahora: number | null;               // reloj de 60 s de la pagina
    permiso: PermisoRed; activo: boolean; conectar: () => void;
    vivo: Record<string, Vivo>;
    enVivo: (dispositivoId: string) => boolean;
  }
  ```
  Lo usan `src/app/monitoreo/page.tsx` y la Task 5. `gestion` se queda en la página `/monitoreo`, porque solo la usa ella.

- [ ] **Step 1: Extraer sin cambiar comportamiento**

Mover el bloque que va de `REFRESCO_MS` a `resumenVivo`/`enVivo`, con el mismo manejo de visibilidad y errores. La página arma `equipos` y `conInflux` a partir de `resumen`.

- [ ] **Step 2: Tipos, lint y suite**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: sin errores, todo verde.

- [ ] **Step 3: Verificar la vista en vivo**

Con `npm run dev:agent`, `/monitoreo` se tiene que ver y comportar igual que antes: contador "Equipos en línea", "Conectar con los equipos" y tarjetas.

- [ ] **Step 4: Commit**

`git commit -m "monitoreo: hook compartido de resumen en vivo"`

---

### Task 3: Kit `anatomy`, modelo y geometría estática de la figura

Esta task y la 4 son el dibujo: tamaño **Hero**, unas 2–4 h. Antes de empezar, leer completos la skill `anatomy` (`SKILL.md`), `references/craft.md`, `references/react.md` y `references/kit.md` (secciones 1–12), y abrir `examples/test-rig/` como modelo de layout React. La regla de la skill es tener una página que se abra en el navegador dentro de la primera hora, y profundizar desde ahí.

**Files:**
- Create: `src/components/iso/`, copiado de `/home/ezequielleiter/.claude/skills/anatomy/kit/`: `iso-kit.ts`, `iso.css`, `react/draw.tsx`, `react/live.tsx`, `lathe.mjs`, `tube.mjs`, `gl.mjs`, `gl-shared.mjs` y `audit.mjs` (solo para tests). Se copian tal cual, con un comentario de origen en la primera línea. `allowJs` ya está activo.
- Create: `src/components/figuras/fructificacion/model.ts`, `model.test.ts`
- Create: `src/components/figuras/fructificacion/view.ts` (medidas, cámara y `P` de `fitProjection`)
- Create: `src/components/figuras/fructificacion/geometry.ts`, `geometry.test.ts`
- Create: `src/components/figuras/fructificacion/art.tsx` (componente de servidor: partes estáticas como elementos con `key`, ver la trampa de `react.md`)
- Create: `src/components/figuras/fructificacion/fructificacion.css` (tokens con alcance `.fructificacion`)

**Interfaces:**
- Consumes: `EquipoResumen` (`src/lib/monitoreo/tipos.ts`).
- Produces:
  ```ts
  // model.ts
  export interface EstadoFigura {
    humidificador: boolean | null;  // null = sin dato vigente
    extractor: boolean | null;
    temperatura: number | null; humedad: number | null;
    fueraTemp: "alta" | "baja" | null; fueraHum: "alta" | "baja" | null;
  }
  export function estadoFigura(e: EquipoResumen | null, enVivo: boolean): EstadoFigura;
  export function largoNiebla(humedad: number | null): number; // cm hasta que la niebla se disipa
  // art.tsx
  export function FructificacionArte(): React.ReactElement; // { back, front, rotor... } como props de elemento para live.tsx
  ```

**Medidas que fija la figura (`view.ts`), todo en cm:**
- **Estructura:**
  - Frente 143 (x), fondo 195 (y), cumbrera 215 (z), alero 150 (el alero sale de la foto; es estimado).
  - Techo a dos aguas con la cumbrera a lo largo de y.
  - Caño Ø1,6.
  - Postes verticales en las 4 esquinas y en los marcos de los estantes, como en la foto.
- **Estantes:**
  - Profundidad 45 desde cada costado; el pasillo es x 45–98.
  - Izquierda: 2 niveles, z = 48 y 95. Derecha: 3 niveles, z = 50, 80 y 110 (el de abajo deja libre la turbina, cuyo cuerpo llega a z = 24).
  - Malla 3,3 × 7,2.
- **Humidificador:**
  - En el piso, en el pasillo adelante a la izquierda: x 50–80, y 10–40, alto 35.
  - Caño de PVC Ø4 vertical desde la tapa (65, 25, 35) hasta z = 120.
  - Codo de 90° con salida hacia +y (hacia el fondo), por donde sale el vapor.
- **Extractor (turbina en línea de 4" = 100 mm):**
  - Cuerpo cilíndrico Ø20, largo 26, con el eje a lo largo de y, apoyado en el piso sobre dos cunas de 4 de alto: eje en x = 115, z = 14, cuerpo entre y = 154 y 180.
  - Collarín de entrada Ø10 (largo 5) que mira hacia el frente (−y), abierto, con reja. Por la reja se ve el rotor (el que gira).
  - Collarín de salida Ø10 hacia el fondo y un conducto flexible Ø10 desde y = 185 que atraviesa el plástico del fondo (y = 195) con una abrazadera y una brida de plástico. Termina afuera en y = 210 con la boca abierta.
  - Cable del motor con un regulador de velocidad apoyado en el piso al lado.
  - Si los valores reales de la turbina (diámetro, largo) son otros, se cambian en `view.ts`.
- **Sensor:** en el medio, colgado de la cumbrera por un cable, en (71,5, 97,5, 140). Caja de 6 × 4 × 10 con ranuras de ventilación.
- **Plástico:** un paño translúcido por cara (frente, fondo, costados y techo), con relleno de poca opacidad. El frente tiene la puerta con cierre (costura en U invertida).
- **Cámara:**
  - La esquina más cercana es adelante a la derecha (x = 143, y = 0): se ven el frente y el costado derecho. Así el aire que sale del fondo queda a la vista a la derecha de la silueta.
  - Elevación de unos 35°, para ver adentro por el plástico.

- [ ] **Step 1: Escribir los tests que fallan para `model.ts`**

`model.test.ts`:
- `estadoFigura(null, false)` da todo `null`.
- Equipo con `conexion: "conectado"` y `aparatos.humidificador.on = true`, `enVivo=false`: da `humidificador: true`.
- **(Review Focus 2)** El mismo equipo con `conexion: "desconectado"` o `"sin_datos"` y `enVivo=false`: da `humidificador: null` y `extractor: null`.
- `conexion: "desconectado"` con `enVivo=true` (responde por la red local): toma `aparatos.*.on`.
- `largoNiebla(60) === 40`, `largoNiebla(95) === 90`, `largoNiebla(30) === 40`, `largoNiebla(100) === 90`, `largoNiebla(null) === 40`.

La niebla ultrasónica es fría y cae. Con el aire más húmedo tarda más en evaporarse; por eso el largo es lineal entre 60 % y 95 % y queda fijo afuera de ese rango.

- [ ] **Step 2: Correrlos y verlos fallar**

Run: `npx vitest run src/components/figuras/fructificacion/model.test.ts`
Expected: FAIL (no existe el módulo).

- [ ] **Step 3: Implementar `model.ts`**

Implementarlo para que pasen.

- [ ] **Step 4: Escribir el test de auditoría que falla**

`geometry.test.ts`, `it("la geometria pasa la auditoria de anatomy")`: arma la figura con el `recorder` de `audit.mjs`, llama a `settle` y después a `audit(R, P)`, y espera que `failures(result)` (o el campo equivalente que devuelva `audit`, ver `kit.md` §12) venga vacío. Es la versión en Vitest de `node build.mjs --audit`.

- [ ] **Step 5: Implementar `view.ts`, `geometry.ts` y `art.tsx`**

Seguir el workflow de la skill, pasos 4–8.
- **Lista de partes:** al menos 80 partes (base, estructura, estantes con malla, humidificador con tapa, perilla, depósito y su línea de nivel, caño, abrazaderas y codo, turbina con cunas, collarines, reja, rotor, conducto, abrazadera y brida, regulador con cable, sensor con cable y ranuras, plástico con costuras, cierre de la puerta y estacas al piso).
- **Construcción:** la estructura se hace con `tube.mjs` y el codo y el conducto con `lathe.mjs`.
- **Orden de dibujo:** con `recorder`/`settle`.
- **Capas:**
  - **SVG de fondo:** piso, plástico del fondo y de la izquierda, estructura del fondo, estantes, extractor, sensor y humidificador.
  - **Canvas:** lo pone la Task 4.
  - **SVG de adelante:** plástico del frente, de la derecha y del techo, y la estructura de adelante.
  - **Grupo del rotor:** se ve por la reja del collarín de entrada y queda en su lugar dentro del SVG de fondo, recortado por la boca del collarín, para que live.tsx lo rote.

  Cada parte va a la capa que corresponde según la pregunta de `webgl.md` §2: "¿alguna vez la tapa el efecto, o tapa ella al efecto?".
- **Etiqueta:** como mucho una, grabada: la placa `INV-2.1M-PVC`.

- [ ] **Step 6: Correr los tests y verlos pasar**

Run: `npx vitest run src/components/figuras/fructificacion/`
Expected: PASS (modelo y auditoría).

- [ ] **Step 7: Página de prueba temporal**

Montar `FructificacionArte` en una página temporal fuera del repo, o directamente en la Task 5. Mirarla con `"/home/ezequielleiter/.claude/plugins/cache/impeccable/impeccable/4.10.0/skills/impeccable/scripts/impeccable" shot` a 1280 y a 390, y con zoom de 4× sobre cada unión (codo, abrazaderas, turbina, paso del conducto por el plástico, sensor, esquinas de la estructura). Correr `node /home/ezequielleiter/.claude/skills/anatomy/scripts/lines.mjs <página> --out <scratchpad>/lines.png` y esperar `line ends: 0`.

- [ ] **Step 8: Commit**

`git commit -m "monitoreo: kit anatomy y figura estatica del invernadero de fructificacion"`

---

### Task 4: Figura en vivo: rotor, vapor y aire

Antes de escribir el shader, leer completo `references/webgl.md` y `references/motion.md`, y abrir `examples/raptor-engine/live.js` (vapor) como referencia.

**Files:**
- Create: `src/components/figuras/fructificacion/live.tsx` (`"use client"`)
- Create: `src/components/figuras/fructificacion/frame.ts` (`rotorDe(angulo: number): string[]`, los paths de las palas del rotor para un ángulo, vistos por la boca del collarín de entrada; lo importa live.tsx)
- Create: `src/components/figuras/fructificacion/shader.ts` (GLSL y uniforms)
- Create: `src/components/figuras/fructificacion/figure.tsx`
- Create: `src/components/figuras/index.tsx` (registro de figuras por modelo)
- Modify: `messages/es/pages.json`, `messages/en/pages.json` (`pages.monitoreo.figura.*`)

**Interfaces:**
- Consumes: `EstadoFigura`, `largoNiebla` y `FructificacionArte` (Task 3); `P` de `view.ts`; `glLayer`, `glCamera` y `GLSL_ISO` de `src/components/iso/gl.mjs`; `useLoop`, `useInView`, `useStillness` y `useReadout` de `src/components/iso/react/live.tsx`.
- Produces:
  ```ts
  // figuras/index.tsx (servidor)
  export const ARTE_FIGURAS: Partial<Record<ModeloInvernadero, React.ReactElement>>;
  // figure.tsx (cliente)
  export function FiguraInvernadero(props: { modelo: ModeloInvernadero; arte: React.ReactElement; estado: EstadoFigura; nombre: string }): React.ReactElement | null;
  ```

**Comportamiento que fija el plan:**
- **Rotor:** gira cuando `extractor === true`. Las RPM siguen el estado con constante de tiempo de 0,8 s al arrancar y de 2,5 s al frenar (sigue girando por inercia). Los paths de las palas se recalculan por ángulo en `frame.ts` y se recortan con la boca del collarín; no se rota la proyección con CSS.
- **Vapor (shader):**
  - Nace en la boca del codo (65, ~31, 120) con salida a +y a ~0,5 m/s. Baja de a poco (la niebla es más pesada que el aire), se abre y se disipa a lo largo de `largoNiebla(humedad)`.
  - Densidad con ruido en espacio de mundo y todos los términos llegando a 0 antes de cualquier borde.
  - Envolvente `settle`: ataque 1,2 s, caída 2,5 s.
- **Aire (shader):**
  - Adentro, hilos tenues que convergen hacia la boca del collarín de entrada (115, 149, 14) en un radio de 40.
  - Afuera, un chorro hacia +y desde la boca del conducto (115, 210, 14), con un cono de 15° y un largo de ~80.
  - El chorro está detrás del plástico del fondo, que va en el SVG de fondo, debajo del canvas. El shader modela ese paño como un plano (y = 195, de x 0 a 143 y de z 0 hasta el techo) que deja pasar el 45 %.
  - Misma envolvente que el vapor.
- **Mezcla:** oscuro, premultiplicada, `mix-blend-mode: screen` (el vapor y el aire solo suman luz). DPR máximo de 1,5. Solo se renderiza con algún efecto activo y la figura en pantalla.
- **Respaldo SVG:** tres volutas de vapor y tres hilos de aire como trazos con `stroke-dasharray` animado. Se ocultan con `.fructificacion[data-gl] .fallback { display: none }` cuando WebGL arranca, y vuelven si se pierde el contexto (`webglcontextlost`).
- **Movimiento reducido:** un cuadro quieto. Volutas estáticas si algo está prendido; rotor quieto.
- **Tarjeta:** `Plate`, siguiendo el paso 8 de la skill:
  - Arriba a la izquierda, `Fig 01`.
  - Título: el nombre del invernadero.
  - Pista: `figura.pista` = "En vivo cada 3 s si el equipo está en tu red; si no, cada minuto." / "Live every 3 s when the device is on your network; otherwise every minute."
  - Lectura (abajo a la derecha, con `useReadout`): `figura.lectura` = "Humidificador {hum} · Extractor {ext} · {temp} °C · {humedad} %", donde cada aparato es `prendido`/`apagado`. Con todo `null` muestra `figura.sinDatos` = "Sin datos en vivo del equipo" / "No live data from the device".
  - La lectura tiene `aria-live="polite"` y la figura `role="img"` con un `aria-label` que dice lo mismo que la lectura.
- **Registro:** `FiguraInvernadero` devuelve `null` si el modelo no está en el registro (Review Focus 1).

- [ ] **Step 1: Implementar `live.tsx` y `figure.tsx`, primero sin shader**

Rotor, respaldo SVG, lectura y accesibilidad. Mirarlo en la página de la Task 5 con un estado forzado.

- [ ] **Step 2: Sumar `shader.ts` y la capa WebGL**

Hacerlo según `webgl.md` §6.

- [ ] **Step 3: Verificar con la skill**

- Correr `node /home/ezequielleiter/.claude/skills/anatomy/scripts/drive.mjs` con `["slow", 0.05]` sobre el prendido y el apagado del humidificador y del extractor (hoja de contactos): no debe saltar nada ni cortarse ningún borde.
- Correr `--no-webgl` y ver el respaldo.
- Correr `lines.mjs` y esperar `line ends: 0`.
- Leer cada PNG.

- [ ] **Step 4: Tipos, lint y suite**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: sin errores, todo verde.

- [ ] **Step 5: Commit**

`git commit -m "monitoreo: figura en vivo con vapor del humidificador y aire del extractor"`

---

### Task 5: Pantalla `/monitoreo/[id]` rediseñada con impeccable

Antes de editar, cargar la skill `impeccable` y seguir su Setup. El modo de la superficie es **Operate**: ambición en precisión, no en adorno. Como el mundo visual está en el código y no hay `DESIGN.md`, se hereda el lenguaje de la sala de control: `font-tele`, tarjetas con `border-divider` y títulos en versalitas. Leer `reference/craft-floor.md` inmediatamente antes de editar UI.

**Files:**
- Modify: `src/app/monitoreo/[id]/page.tsx` → componente de servidor:
  ```tsx
  <Suspense><MonitoreoInvernadero arte={ARTE_FIGURAS} /></Suspense>
  ```
- Create: `src/components/monitoreo/MonitoreoInvernadero.tsx` (`"use client"`: lo que hoy está en `Contenido`, más lo nuevo)
- Modify: `src/components/monitoreo/MonitoreoPanel.tsx` (prop `onDispositivoChange?: (id: string) => void`, que se llama en un efecto cuando cambia el dispositivo elegido)
- Modify: `src/components/monitoreo/vista/EquipoCard.tsx` (prop `enlace?: boolean`, por defecto `true`, que oculta el botón "Monitoreo" en esta página)
- Modify: `messages/*/pages.json` si hace falta copy nueva

**Interfaces:**
- Consumes: `useResumenEnVivo` (Task 2), `estadoFigura` (Task 3), `ARTE_FIGURAS` y `FiguraInvernadero` (Task 4), `Invernadero.modelo` (Task 1).

**Layout que fija el plan (lo afina impeccable sin cambiar este orden):**
1. **Encabezado:**
   - Logo, `MONITOREO` y el nombre del invernadero.
   - Estado de conexión del equipo elegido, con el mismo punto y texto de `EquipoCard`.
   - El botón "Conectar con los equipos" cuando `permiso === "prompt"`, y el aviso cuando el permiso está `denied`.
   - El botón "Vista en vivo".
2. **Fila principal (desde md):** la figura a la izquierda (`2fr`) y la `EquipoCard` del equipo elegido a la derecha (`1fr`, `enlace={false}`). Sin `modelo` con figura, la tarjeta ocupa esa fila sola y la página queda como hoy. En el celular van apiladas: figura, tarjeta.
3. **Debajo:** `MonitoreoPanel` con `onDispositivoChange`. El equipo elegido arranca en `?dispositivo=` y después sigue al selector del panel (Review Focus 5).

- [ ] **Step 1: Implementar la página según el layout**

- [ ] **Step 2: Pasada de impeccable**

Run: `"/home/ezequielleiter/.claude/plugins/cache/impeccable/impeccable/4.10.0/skills/impeccable/scripts/impeccable" shot http://localhost:3099/monitoreo/<id>` a 1280 y a 390, con la sesión QA.

Corregir lo que muestre una mirada (jerarquía, ritmo, alineación entre figura y tarjeta, estados de carga y error), y recién ahí volver a mirar.

- [ ] **Step 3: Detector**

Run: `"/home/ezequielleiter/.claude/plugins/cache/impeccable/impeccable/4.10.0/skills/impeccable/scripts/impeccable" detect --json --changed`
Expected: sin hallazgos, o cada uno corregido o justificado en el commit.

- [ ] **Step 4: Tipos, lint y suite**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: sin errores, todo verde.

- [ ] **Step 5: Sembrar datos QA**

Con `npm run dev:agent`, en `cultivo_hongos_agent`:
- Un invernadero con `modelo: "kallampa_fructificacion_1"` y dos dispositivos con `influxId` reales (`0c2cc8`, `d2d0e0`).
- Otro invernadero sin modelo.

- [ ] **Step 6: Verificar en el navegador**

Usar Chrome. Si la extensión no está, headless por CDP, como en el plan anterior.
- La figura se ve. Con el equipo prendido, la lectura coincide con la `EquipoCard` de al lado.
- **Review Focus 1:** el invernadero sin modelo se ve como hoy.
- **Review Focus 2:** forzar `conexion: "desconectado"` (dispositivo con `influxId` que no reporta) y comprobar que no hay vapor y que dice "Sin datos en vivo del equipo".
- **Review Focus 3:** sin WebGL (`--disable-webgl`), se ve el respaldo SVG y no hay errores en la consola.
- **Review Focus 4:** con movimiento reducido emulado (`Emulation.setEmulatedMedia` con `prefers-reduced-motion: reduce`), cuadro quieto con el estado legible.
- **Review Focus 5:** al cambiar de equipo en el selector del panel, cambian la figura y la tarjeta.
- A 390 px de ancho no hay scroll horizontal.

Al terminar, `npm run db:reset-agent`.

- [ ] **Step 7: Commit**

`git commit -m "monitoreo: pantalla del invernadero con la figura en vivo"`
