# Monitoreo en vivo desde los equipos — diseño corto

## Por qué
La vista `/monitoreo` lee InfluxDB, que llega cada ~1 min y detecta una desconexión recién a los 2 × `intervalo_min`. Los equipos (ESP32) ya exponen `GET /sensors` con CORS abierto, actualizado cada 2,5 s. La vista va a estar abierta en el lugar, en Chrome, dentro del mismo WiFi: puede leer el equipo directo y mostrar el estado al instante.

## Objetivos
- Temperatura, humedad, relés, potencias, sensor reintentando, tanque de agua y estado del extractor en tiempo real (cada 3 s) cuando el equipo responde.
- Latido instantáneo: si el equipo no responde en 3 s, la tarjeta dice "Sin conexión local" y vuelve a los datos de Influx.
- InfluxDB sigue siendo la fuente de gráficos de 24 h, rangos objetivo, % en rango, uso 24 h, WiFi, reinicios y firmware.

## No objetivos / anti-objetivos
- No guardar los datos en vivo, no mandar órdenes al equipo, no cambiar el firmware.
- No soportar Safari/Firefox (no tienen Local Network Access): ahí la vista sigue solo con Influx, sin errores.
- Anti-objetivo: cargar al equipo (atiende un pedido por vez). Nunca dos pedidos en vuelo al mismo equipo, ni pedir más seguido que cada 3 s.

## Restricciones
- Producción es `https://kallampa-app.vercel.app`; el equipo es `http://`. Se usa Local Network Access de Chrome/Edge 145+: `fetch(url, { targetAddressSpace: "local" })` exime del bloqueo de contenido mixto y Chrome pide el permiso "red local" una vez.
- El primer pedido con permiso en estado `prompt` sale de un gesto del usuario (botón). Con `granted` arranca solo. Con `denied`, se explica cómo habilitarlo en la configuración del sitio.
- `navigator.permissions.query({ name: "local-network" })` va en try/catch (nombre desconocido ⇒ tratar como `prompt`). Nunca consultar `"local-network-access"` (cuelga Chrome viejo).

## Enfoques considerados
1. **Elegido: el navegador consulta cada equipo directo** (LNA + `targetAddressSpace`). Cero infraestructura nueva.
2. Que la API de Vercel consulte al equipo: imposible, Vercel no ve la red local.
3. Servidor intermediario en la red local: funciona en cualquier navegador pero suma una compu a mantener; solo haría falta para Safari, que no se usa.

## Decisiones
- **Dirección:** se usa el campo existente `dominio` del dispositivo (ya obligatorio; acepta `nombre.local` o IP, con puerto opcional). Se toma solo `host[:puerto]` (se descarta cualquier ruta) y se pide `http://<host>/sensors`.
- La API `/api/monitoreo/resumen` suma `dominio` a cada `EquipoResumen`.
- **Sondeo:** por equipo, un bucle secuencial: pedido con timeout de 3 s (`AbortSignal.timeout(3000)`), después espera 3 s y repite. Pausa con la pestaña oculta. Para al desmontar.
- **Mezcla:** una función pura `aplicarVivo(equipo, sensors)` devuelve el `EquipoResumen` con `ahora.temperatura/humedad`, `aparatos.*.on/potencia`, `fueraTemp/fueraHum` recalculados contra los rangos de Influx, y alarmas en vivo (`sensor_falla` si `retrying` o `!ok`; `agua_vacia` si `water === false` o `water` es un texto distinto de `"ok"`; `water === null` ⇒ sin flotante, sin alarma). Medido el 2026-11-20: Fructificación devuelve `"water":"ok"`, Colonización `null`. `aparatos.calefaccion.aprendiendo` en vivo = `heatMode === "learning"`; el humidificador conserva el de Influx. El resto queda como vino de Influx. `wifi_debil` sigue saliendo de Influx.
- **Extractor:** si `extractorPaused` ⇒ "en pausa"; si `extractorWaitingHum` ⇒ "esperando humedad"; si `extractorRemaining` ⇒ "cambia en m:ss".
- **Estado de conexión en la tarjeta:** "EN VIVO · hace N s" (punto acento) cuando hay respuesta reciente; "SIN CONEXIÓN LOCAL" (gris) más el "hace X" de Influx si falla; si no hay permiso todavía, la tarjeta se ve como hoy.
- **Barra superior:** botón "Conectar con los equipos" cuando el permiso está en `prompt`; aviso corto con cómo habilitarlo cuando está `denied`; nada cuando está `granted` o el navegador no soporta LNA (se intenta igual y, si falla, cada tarjeta dice "Sin conexión local").
- El panel de Alertas usa los valores ya mezclados.

## Para quien construye
- Validar `/sensors` defensivamente (campos numéricos/booleanos con tipos esperados; si el JSON no tiene forma, se trata como fallo).
- Tests: `aplicarVivo` y la extracción de host desde `dominio` (unidad); el resumen incluye `dominio`.
- Verificación manual: no se puede probar LNA contra los equipos reales desde el servidor de prueba sin estar en el WiFi del lugar; se prueba con un `/sensors` falso en la red local (ej. un servidor en `127.0.0.1` declara `loopback`, no `local`), o directamente en el lugar.
