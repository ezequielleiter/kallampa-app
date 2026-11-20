# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Hoy lo usan solamente las cooperativas de trabajo Teo y Lawal para llevar su propio cultivo de hongos. Más adelante la idea es sumar a otros productores (la app ya es multicuenta, con los datos de cada cuenta aislados). Todavía no está definido si se carga sobre todo desde el celular en el cultivo o desde la computadora.

## Product Purpose

Kallampa ("hongo" en quechua) registra el cultivo completo de hongos en un solo lugar, de la cepa a la cosecha: lotes y etapas, frascos de grano, recipientes de sustrato, oleadas, contaminación, clonación y micelio líquido, costos y rendimiento (eficiencia biológica, costo por kg), trazabilidad de cada frasco, ventas y stock de producto, y el clima de los invernaderos. Funciona bien si el productor deja de llevar el cultivo en papel o en planillas sueltas y puede ver qué tiene pendiente, cuánto rinde y cuánto le cuesta.

## Positioning

Lo hacen productores para productores: dos cooperativas que cultivan y diseñan con su propio vocabulario y su propio flujo de trabajo. Además, el registro se conecta con controladores de clima propios basados en ESP32, que las cooperativas instalan, y con sus datos en InfluxDB.

## Operating Context

- Trabajo en el laboratorio (placas, clonación, micelio líquido, frascos de grano) y en el invernadero (recipientes, fructificación, cosecha).
- Códigos de trazabilidad del tipo `ENK-L-2026-001-R02` (especie, tipo, año, número y unidad); el identificador busca por N° de guía.
- Los invernaderos tienen dispositivos ESP32 que se ven en la red local. La app muestra gráficos de calefacción y humidificación con líneas de mínima y máxima, y una tabla de ciclos.
- Uso diario y repetido: es una herramienta de trabajo, no algo que se abre de vez en cuando.

## Capabilities and Constraints

- Aplicación (panel desde `/lotes`): lotes, clonación, invernaderos, inventario, calendario, notas, estadísticas, trazabilidad, identificador, herramientas (calculadoras de sustrato y de tachos) y ventas.
- Landing pública en `/`. Tiene **dos objetivos con el mismo peso**: presentar el software y vender la instalación del control de clima (por el formulario de contacto).
- En español e inglés (next-intl, `messages/`).
- Producción en Vercel + MongoDB Atlas; el registro de cuentas está cerrado por defecto en producción (`REGISTRO_HABILITADO`).
- InfluxDB es opcional: sin configurarlo, el monitoreo responde que no está configurado y el resto de la app funciona igual.
- Pendiente de definir: el dispositivo principal de carga (celular o computadora) y el modelo comercial para otros productores.

## Brand Commitments

- **Identidad cooperativa (obligatoria):** tiene que notarse que Kallampa lo hacen las cooperativas de trabajo Teo y Lawal en forma intercooperativa.
- Nombre: Kallampa, con su origen quechua. Ícono actual en `src/app/icon.svg`; hay más material de marca en `public/brand/`.
- Vocabulario de productor a productor: frasco, grano, sustrato, recipiente, placa, oleada, eficiencia biológica.

## Evidence on Hand

- La descripción de funciones está en `README.md`; lo pendiente, en `TODO.md`.
- No hay testimonios, clientes externos, casos ni precios. Las únicas usuarias son las propias cooperativas, así que no hay que inventar productores, cifras de adopción ni testimonios.

## Product Principles

1. Primero la herramienta de trabajo: lo que se usa todos los días va antes que lo vistoso.
2. Habla como productor: usar los términos del oficio, sin traducirlos a jerga genérica.
3. Todo se puede rastrear: cada frasco, recipiente y cosecha tiene que poder seguirse hasta su origen.
4. Es una obra cooperativa: la autoría colectiva de Teo y Lawal es parte de la identidad.
5. Preparado para crecer: hoy es para uso propio, pero tiene que servirles a otros productores sin rehacerlo.
