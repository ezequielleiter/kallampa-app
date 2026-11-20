# Vista de monitoreo — diseño

Fecha: 2026-11-20. Decisiones tomadas con el usuario en la conversación.

## Qué es

Una página del panel, "Vista de monitoreo" (`/monitoreo`), que se abre desde la barra lateral y muestra de un vistazo:

1. **Equipos de los invernaderos** (ESP32, datos de InfluxDB), agrupados por invernadero.
2. **Sistema de gestión**: inventario vivo (frascos y recipientes por estado) y lotes activos.

No cruza clima con recipientes: los recipientes todavía no tienen invernadero asignado (queda para otro plan, ver `TODO.md`). Tampoco cambia la página de inicio después del login (sigue siendo `/lotes`).

## Equipos: qué se muestra por cada dispositivo con `influxId`

- **Clima ahora vs rango:** temperatura y humedad más recientes (`ambiente`) contra el rango objetivo. El rango sale del último `estado` (`temp_min`, `temp_max`, `hum_min`, `hum_max`); si no hay `estado`, de los valores cargados a mano en el dispositivo (`tempMin`…). Marca "fuera de rango" por arriba o por abajo.
- **Conectado / desconectado:** latido por `estado`. Desconectado si el último `estado` tiene más de `2 × intervalo_min` minutos. "Sin datos" si no hay `estado` en 24 h. Se muestra hace cuánto llegó el último dato y, si `pendientes > 0`, que está vaciando cola.
- **Aparatos y alarmas:** `hum_on`, `calef_on`, `ext_on` (prendido ahora), con `hum_pot`/`calef_pot` (%) y `hum_aprendiendo`/`calef_aprendiendo`. Alarmas: `agua_vacia === true` (solo si el campo existe), `sensor_ok === false`, señal `rssi < -80`.
- **Últimas 24 h:** mín/máx/promedio de temperatura y humedad; % del tiempo dentro de rango (sobre ventanas de 5 min, contra el rango actual); % de uso de humidificador, calefacción y extractor (`Σ *_seg / 86400`); cantidad de reinicios (veces que baja `uptime_s`) y motivo del último (`reset`); firmware (`fw`).

Dispositivos sin `influxId`: aparecen con la leyenda "Sin InfluxDB" y enlace al invernadero. Sin variables `INFLUX_*`: la sección de equipos muestra el aviso existente `influx_no_configurado` y la sección de gestión funciona igual.

## Gestión

- **Inventario vivo:** frascos de grano `colonizando`, `colonizado`; recipientes `incubando`, `fructificando`. Más contaminados de los últimos 30 días (frascos y recipientes con `estado: "contaminado"` y `updatedAt` en los últimos 30 días).
- **Lotes activos:** lotes con `estadoDerivado === "en_progreso"`, con hongo, frascos activos, recipientes incubando/fructificando y alertas (demorados). Cada uno enlaza a `/lotes/[id]`.

## Datos de InfluxDB (dados por el usuario)

InfluxDB Cloud 2.x (Flux). Org `teocoop`, bucket `carpa-colonizacion`. Equipos distinguidos por tags; filtrar por `id` (no cambia si se renombra):

| device | id | sensor |
|---|---|---|
| fungi-colonizacion | 0c2cc8 | DHT22 |
| fungi-fructificacion | d2d0e0 | SHT30 |

Cada equipo escribe cada `intervalo_min` minutos (hoy 1). Horas en UTC.

- `ambiente` (tags device, id): `temperatura` (float °C), `humedad` (float %). No se escribe si falló el sensor.
- `actuadores` (tags device, id): `humidificador_seg`, `calefaccion_seg`, `extractor_seg` (int, segundos prendido en el intervalo). `ambiente` y `actuadores` se encolan si no hay conexión (hasta ~12 h) y llegan después con su hora original.
- `estado` (tags device, id, sensor): solo se escribe si el equipo pudo enviar (latido). Datos desde 2026-11-20. Campos: `online` int, `intervalo_min` int, `uptime_s` int, `reset` string, `fw` string, `rssi` int, `heap_libre`/`heap_min` int, `pendientes` int, `sensor_ok` bool, `agua_vacia` bool (opcional), `hum_on`/`calef_on`/`ext_on` bool, `hum_min`/`hum_max` int, `temp_min`/`temp_max` float, `hum_pot`/`calef_pot` float, `hum_aprendiendo`/`calef_aprendiendo` bool.
- Flux: `estado` mezcla tipos; usar `pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")` **sin `group()` antes**.

## Comportamiento

- Se actualiza sola cada 60 s mientras la pestaña está visible; muestra "Actualizado hace …".
- Funciona en celular (una columna) y en compu (tarjetas en grilla).
- El token de Influx nunca sale del servidor.
