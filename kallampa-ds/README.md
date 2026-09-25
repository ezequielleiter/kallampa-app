# Kallampa · Sistema de diseño

Kallampa (del quechua: *hongo*) es un sistema de gestión para cultivos de hongos. Cubre la producción por lotes (inoculación → incubación → fructificación → cosecha), el control de contaminación, la clonación y el micelio, la trazabilidad, los costos y precios, y la automatización de invernaderos (humedad, temperatura y CO₂). Lo desarrollan en forma intercooperativa las cooperativas de trabajo **Teo** y **Lawal**.

Este paquete reúne los tokens, los componentes React y las guías para construir sus pantallas, con Claude Code o a mano.

## Superficies del producto
- **Landing** (marketing): hero con micelio animado, panel de invernadero en vivo, módulos, automatización con formulario de contacto. Referencia: `Kallampa Landing.dc.html`.
- **Acceso**: login (email o usuario + contraseña) y registro (email, usuario, contraseña). Referencia: `Kallampa Acceso.dc.html`.
- **Panel** (app): Producción (lista de lotes, nuevo lote, detalle de lote) y Micelio (clonaciones, nueva clonación, detalle con placas y micelio líquido). Referencia: `Kallampa Panel.dc.html` y `ui_kits/panel/`.

## Fuentes
- Base visual: sistema **Nocturne** (tokens y clases copiados en `tokens/base.css`).
- Pantallas originales del equipo (capturas del panel "Cultivo" actual: lotes, detalle de lote, micelio). No hubo acceso a código fuente ni a Figma.
- Prototipos de este proyecto (raíz): `Kallampa Landing.dc.html`, `Kallampa Acceso.dc.html`, `Kallampa Panel.dc.html`, `Kallampa Lote.dc.html` (exploraciones), `Kallampa Logo.dc.html` (exploraciones de marca).

## Uso rápido (React)
1. Copiá `kallampa-ds/` a tu repo (p. ej. `src/design-system/`).
2. Importá una vez los estilos globales: `import './design-system/styles.css'` (trae Inter desde Google Fonts, tokens, clases base y keyframes).
3. Cargá los íconos Phosphor: `<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css">` o el paquete `@phosphor-icons/web`.
4. Importá componentes: `import { Button } from './design-system/components/core/Button.jsx'`. Cada uno tiene su `.d.ts` (props) y su `.prompt.md` (cuándo usarlo + ejemplo).
5. Sin build (HTML suelto): `dev/load-components.js` transpila los .jsx en el navegador y expone `window.KallampaDS` (ver `ui_kits/panel/index.html`).

## CONTENT FUNDAMENTALS
- **Idioma**: español rioplatense. En el panel se usa **voseo** en instrucciones y errores: "Elegí un hongo", "Ingresá el peso de grano", "Repartí grano colonizado…". La landing usa tuteo ("Cuéntanos sobre tu cultivo"). **Recomendación: unificar en voseo** si el público es argentino/uruguayo.
- **Tono**: técnico, directo, de productor a productor. Sin exclamaciones ni emoji. Nombres del oficio: frasco, grano, sustrato, recipiente, placa, micelio líquido, oleada, eficiencia biológica (EB), zona/carpa.
- **Mayúsculas**: oración normal en títulos y botones ("Nueva incubación", "Guardar oleada"). Mayúsculas solo en kickers pequeños ("PENDIENTES") y encabezados de tabla (lo hace la clase).
- **Botones**: verbo + objeto ("Crear recipiente", "Agregar oleada", "Pasar a fructificación", "Marcar contaminado").
- **Errores**: qué pasó + cómo resolverlo, en una línea: "Hay 8 kg de centeno en inventario. Reducí el peso o cargá más stock." · "No puede ser anterior al inicio de fructificación (22/09/2026)." En login, mensaje genérico sin revelar si existe el usuario: "El usuario o la contraseña no son correctos."
- **Confirmaciones (toast)**: nombran registro y resultado: "R04 creado en Carpa 1", "2ª oleada de R02 guardada: 1,20 kg".
- **Números**: formato es-AR: coma decimal, punto de miles, espacio antes de unidad: `4,00 kg`, `80,0 %`, `$ 9.160`, `500 ml`. Fechas `dd/mm/aaaa`. Siempre cifras tabulares.
- **Códigos trazables**: `{ESPECIE}-{TIPO}-{AÑO}-{NNN}` + sufijo de unidad. Lotes `ENK-L-2026-001`, frascos `-F01`, recipientes `-R01`, clonaciones `ENK-C-2026-001`, placas `-P01`, micelio líquido `-L01`. Prefijos: ENK Enoki, OST Ostra rosada, OSG Ostra gris, SHI Shiitake, MDL Melena de león. Se muestran antes de crear el registro ("Se va a crear ENK-L-2026-001-R04").
- **Especies**: nombre común + científico en itálica ("Enoki · *Flammulina velutipes*").

## VISUAL FOUNDATIONS
- **Fondo**: oscuro azul-gris `--color-bg` (#161826). En landing y acceso, un resplandor de acento arriba a la derecha y sombra abajo a la izquierda. En el panel, fondo plano.
- **Color**: esquema mono. Un solo acento blurple (`--color-accent` #9184d9) usado como **línea, marca y brillo**, nunca como relleno grande. Contraste por rampas de tono (100–900), no por saturación. Única excepción cromática: **coral de peligro** `--color-danger` (oklch 0.64 0.13 28) para contaminación y errores, a bajo croma. Banda saturada `--color-section` solo en la landing (trazabilidad, contacto).
- **Tipografía**: Inter en todo. Títulos 500 (nunca más), tracking negativo (-0.01 a -0.02em). Escala del panel: 22 título de vista, 16 sección, 13–13,5 cuerpo de tabla/form, 12 meta/labels, 11 tags. Landing: display 42–80px fluido.
- **Espaciado**: denso a propósito (escala 0,7×). Página 20–24px, 14px entre cards, 12–16px entre campos, 16×20 dentro de cards.
- **Radios**: 8px controles y bloques internos, 14px cards/modales, 4px tags pequeños.
- **Cards**: `--surface-card` + borde de 1px vía `--shadow-sm` (sin sombra difusa). Las accionables (Pendientes, Próximo paso) llevan borde de acento. Bloques anidados: `--surface-inset` sin borde.
- **Elevación**: borde + oscuridad ambiente. `shadow-md` para paneles flotantes de landing, `shadow-lg` para modales, drawers, menús y toasts. Nunca apilar sombras.
- **Reglas**: las divisorias largas se desvanecen en los extremos (48px); la tabla lo hace por fila.
- **Botones**: primarios con **contorno** de acento sobre transparente, nunca rellenos. Hover = tinte del acento; foco = anillo de 2px de acento (`:focus-visible`).
- **Estados de dominio**: en progreso = contorno/anillo (Colonizando, Incubando, En desarrollo); activo/listo = relleno de acento (Colonizado, Listo, Fructificando); terminado = neutro (Usado, Finalizado, Cosechado); descartado = neutro tachado; contaminado = coral.
- **Movimiento**: `--ease-out` cubic-bezier(.2,.7,.2,1). Menú .15s, modal .22s (pop), drawer .28s (slide), toast 3,2s. Landing: micelio que crece, revelado al hacer scroll, lecturas de sensores que cambian. Todo se apaga con `prefers-reduced-motion`.
- **Transparencia y blur**: solo en la topbar pegajosa (88% + blur 8px) y el fondo de modales (blur 3px).
- **Imágenes**: por ahora no hay fotografía. Si se usa, pasa por `.lighten` (mix-blend-mode: lighten) y conviene fotografiar sobre fondo negro.
- **Layout del panel**: sidebar fija de 208px, topbar pegajosa, contenido hasta 1360px con columna lateral de 280–300px que baja debajo en anchos chicos. Tablas con scroll horizontal y códigos sin cortes.

## ICONOGRAPHY
- **Phosphor Icons, peso regular**, vía CDN (`@phosphor-icons/web@2.1.1`), como `<i class="ph ph-{nombre}">`. Heredan `currentColor`.
- Tamaños: 16px en navegación y filas, 14–15px en botones y menús, 18–20px en tarjetas.
- Color: neutro por defecto; acento solo en íconos de estado o acción; coral en advertencias.
- Íconos por sección: Producción `plant`, Micelio `flask`, Invernaderos `thermometer-simple`, Calendario `calendar-blank`, Trazabilidad `tree-structure`, Notas `note`, Identificador `barcode`, Inventario `package`, Estadísticas `chart-bar`. Sensores: `drop` (humedad), `thermometer-simple`, `wind` (CO₂), `fan`. Acciones: `plus`, `dots-three`, `pencil-simple`, `git-branch` (clonar), `arrow-right`, `trash`, `warning-circle`, `basket` (cosecha), `hourglass-medium`.
- Sin emoji ni caracteres unicode como íconos.
- **Logo**: símbolo propio (opción 2e): sombrero y pie sobre una línea de suelo, micelio debajo en acento. `assets/kallampa-mark.svg`, `kallampa-mark-small.svg` (≤24px, sin línea de suelo), `kallampa-lockup.svg`, y el componente `Logo` (con animación de entrada opcional). Wordmark en minúsculas, Inter 500.
- Socios: `assets/teo-logo.png`. **Falta el logo de Lawal.**

## Índice
- `styles.css` — entrada única (imports).
- `tokens/base.css` — tokens y clases Nocturne (.btn, .tag, .input, .field, .seg, .table, .card, .dialog, .nav, .lighten).
- `tokens/kallampa.css` — tokens semánticos de producto (superficies, texto, peligro, estados, layout, movimiento).
- `tokens/motion.css` — keyframes `k-*`.
- `components/` — 28 componentes React (`.jsx` + `.d.ts` + `.prompt.md`), una card de muestra por carpeta:
  - core: Button, IconButton, Tag, StatusTag, StatusDot, Logo
  - forms: Field, Input, Select, Textarea, Checkbox, SegmentedControl, ChoiceList, StateSelect
  - data: Table, ProgressDays, Kpi + KpiGrid, Stepper, CostBreakdown
  - layout: Card, SectionCard, PendingList
  - navigation: Sidebar, Topbar
  - overlay: Dialog, Drawer, Menu, Toast
- `ui_kits/panel/` — panel click-through (lista de lotes → detalle, menú, modal de oleada, drawer de incubación).
- `guidelines/` — cards de fundamentos (color, tipo, espaciado, radios, movimiento, logo, íconos, socios).
- `assets/` — logos.
- `dev/load-components.js` — cargador sin build.
- `SKILL.md` — skill para Claude Code.

## Adiciones deliberadas
El inventario sale de los prototipos de este proyecto (no hay librería de origen). Componentes de dominio agregados porque se repiten en todas las vistas:
- StatusTag y StatusDot: un único mapeo estado → tono.
- StateSelect: cambiar estados dentro de las tablas.
- ChoiceList: elegir frascos o micelio de origen con su estado.
- ProgressDays: días de cada etapa.
- PendingList: próximos pasos derivados del estado.
- CostBreakdown: costos por lote.

## Reglas de comportamiento (del prototipo)
- Solo se pueden usar como origen los frascos Colonizados (o Usados, para repartir grano), y el micelio líquido Listo. Los demás se muestran deshabilitados, no ocultos.
- "Clonar" aparece solo en frascos Colonizados y recipientes Fructificando.
- Los recipientes se finalizan desde el panel ("Marcar finalizado"), no desde el modal de oleada.
- Las oleadas se pueden editar y eliminar (con confirmación); la fila queda marcada "· editada".
- Validación al enviar y en vivo después; errores bajo cada campo; advertencias no bloqueantes (p. ej. EB > 150 %).
- Escape y clic afuera cierran modales, drawers y menús.
