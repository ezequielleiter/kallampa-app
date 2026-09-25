# TODO: lo que muestra el diseño Kallampa y el back todavía no soporta

Surge de aplicar el sistema de diseño `kallampa-ds/` al front. Todo lo de esta lista **se dejó afuera del front a propósito**, porque no hay modelo, endpoint o dato que lo respalde. Cuando exista el back, el front se completa con los componentes que ya están en `src/components/kallampa/`.

## Módulos nuevos

- [ ] **Invernaderos: lecturas y automatización**: ya se pueden cargar invernaderos con nombre y medidas (alto × largo × profundidad) en `/invernaderos` y asociarles dispositivos de monitoreo (nombre + dominio en la red local). La app no se comunica con esos dispositivos: solo abre su página, y eso funciona únicamente desde la misma red wifi. Si algún día se quiere ver humedad, temperatura o CO₂ dentro de la app, o automatizar (ventiladores, riego), hace falta definir cómo leer los datos del micro (endpoint JSON, CORS o un proxy en la misma red) y, si se quiere historial, dónde guardarlo.
- [ ] **Landing de marketing y formulario de contacto**: el README del DS la menciona (`Kallampa Landing.dc.html`), pero ese prototipo no está en `kallampa-ds/`, y el formulario necesita un endpoint para recibir los contactos.

## Producción (lotes, recipientes y cosecha)

- [ ] **Zona o carpa de incubación por recipiente**: el diseño muestra la columna "Zona" en Incubación, el select "Zona de incubación" con la ayuda "2 recipientes · 22 °C", toasts como "R04 creado en Carpa 1" y pendientes como "R03 incubando en Carpa 1". `Recipiente` no tiene zona y no hay catálogo de zonas (ni su temperatura). Ya existe el modelo `Invernadero` (`src/models/Invernadero.ts`): el paso siguiente es sumar un `invernaderoId` opcional al recipiente y elegirlo en "Nueva incubación".
- [ ] **Stock de inventario de grano y sustrato**: ayudas como "42 kg en inventario · $200/kg" y la validación "Hay 8 kg de centeno en inventario. Reducí el peso o cargá más stock.". Los catálogos (`GrainType`, `SubstrateType`) no tienen stock ni precio por defecto, así que el precio se sigue cargando a mano en cada lote o recipiente.
- [ ] **Gastos adicionales del lote**: en el diseño, `CostBreakdown` suma "Energía" y "Bolsas y filtros" y tiene un link "+ Agregar gasto". Hoy el costo del lote es solo grano + sustrato (`costoProduccionBatch`), que es lo que muestra el front.
- [ ] **Cepa y generación como origen del lote**: en la lista, la columna Origen muestra "Cepa M-03 (G2)". Hoy el origen puede ser solo un frasco de micelio líquido (`origenFrascoLiquidoId`). Si no hay frasco, el front muestra "—".
- [ ] **Etapa actual en la lista de lotes**: en el diseño, el tag de la lista dice la etapa ("Inoculación", "Incubación", "Cosecha"). `GET /api/batches` devuelve solo `estadoDerivado` (en progreso / finalizado), así que la lista muestra "En progreso". El detalle sí calcula la etapa en el cliente, porque tiene frascos y recipientes.
- [ ] **Marca "· editada" en oleadas**: las oleadas se pueden editar (PATCH), pero no se guarda si fueron editadas (falta `editadaAt` o similar).
- [ ] **Vista previa del próximo código**: el drawer de "Nueva incubación" dice "Se va a crear ENK-L-2026-001-R04" antes de crear. Para anticiparlo sin adivinar (ante borrados o concurrencia) hace falta un endpoint que devuelva el próximo número de recipiente, placa o frasco líquido.

## Micelio

- [ ] **Estado "Listo" del micelio líquido**: el DS dice "Listo" para el micelio líquido utilizable y la app usa `colonizado`. Hay que decidir el nombre: si se mantiene el enum, alcanza con cambiar el label en `messages/*/common.json` (`estados.frascoLiquido.colonizado`).

- [ ] **Estado de la clonación ("en curso / finalizada")**: la lista de Producción filtra por estado y, en Micelio, la clonación no tiene un estado propio (ni derivado en la API). Por eso el filtro de la lista de clonaciones es por origen (placas / comprado / frascos de grano).

## Topbar

- [ ] **Escanear código**: la topbar del DS tiene un botón `barcode` para escanear el N° de guía con la cámara. Es solo front (cámara + lectura de código de barras), pero es una funcionalidad nueva y quedó fuera del rediseño. La búsqueda por texto contra `/api/jars/search` sí está.

## Marca

- [ ] **Logo de Lawal**: el DS lo marca como faltante (solo está `kallampa-ds/assets/teo-logo.png`).
