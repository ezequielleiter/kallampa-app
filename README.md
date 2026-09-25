<div align="center">

<img src="src/app/icon.svg" alt="Kallampa" width="88" height="88" />

# Kallampa

**Gestión de cultivos de hongos, de la cepa a la cosecha.**

*Kallampa* significa *hongo* en quechua.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?logo=mongodb&logoColor=white)
![InfluxDB](https://img.shields.io/badge/InfluxDB-2.x-22ADF6?logo=influxdb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/deploy-Vercel-000000?logo=vercel&logoColor=white)

</div>

---

Kallampa es un sistema para productores de hongos que quieren llevar el registro completo de su cultivo en un solo lugar:
- los lotes y sus etapas;
- la contaminación;
- la clonación y el micelio líquido;
- los costos y el rendimiento;
- la trazabilidad de cada frasco;
- el clima de los invernaderos.

Todo con un vocabulario de productor a productor: frasco, grano, sustrato, recipiente, placa, oleada, eficiencia biológica.

Lo desarrollan en forma intercooperativa las cooperativas de trabajo **Teo** y **Lawal**.

## Qué se puede hacer

### Producción
- **Lotes** con su ciclo completo: inoculación en grano → incubación → fructificación → cosecha.
- **Frascos de grano** con estado (colonizando, colonizado, contaminado, usado) y **recipientes** de sustrato que se arman a partir de uno o varios frascos colonizados.
- **Oleadas de cosecha** por recipiente, que se pueden editar o eliminar si hubo un error de carga.
- **Indicadores por lote**:
  - peso cosechado;
  - **eficiencia biológica**;
  - costo total y **costo por kg**, calculados con el grano y el sustrato usados.
- **Pendientes** del lote, calculados según el estado: qué está incubando, qué está demorado, qué frasco hay que descartar.

### Micelio
- **Clonaciones** desde placas de Petri, micelio comprado o frascos de grano, con el estado de cada placa.
- **Micelio líquido** que se genera a partir de placas colonizadas y se puede usar como origen de un lote nuevo.

### Trazabilidad
- Códigos que identifican el origen y se pueden rastrear, por ejemplo `ENK-L-2026-001-R02`: especie, tipo, año, número y unidad.
- Árbol **lote → clonación → lote** para seguir la genética de cada cultivo.
- **Identificador**: buscás un N° de guía y llegás directo a su lote.

### Invernaderos y monitoreo
- Invernaderos con sus medidas (alto × largo × profundidad), superficie y volumen.
- **Dispositivos de monitoreo** asociados: controladores propios basados en ESP32, cada uno con un link a su página en la red local.
- **Gráficos de calefacción y humidificación**:
  - leen de **InfluxDB** temperatura, humedad y tiempo de los actuadores prendidos;
  - muestran las líneas de mínima y máxima configuradas;
  - tienen rangos de 1 h a 7 días;
  - traen una **tabla de ciclos** (cuánto estuvo prendido, cuánto subió, cuánto duró el efecto y a qué ritmo cae).

### Landing
- Página pública en `/` que presenta el sistema: hero con micelio animado y un panel de invernadero en vivo, trazabilidad, módulos, automatización y un **formulario de contacto** para pedir la instalación del control de clima. El panel arranca en `/lotes`.

### Y además
- **Calendario** con las fechas esperadas de cada etapa y tareas propias.
- **Notas** en Markdown.
- **Inventario** de especies, granos y sustratos, con los días esperados por etapa.
- **Estadísticas**: comparativas por lote, por hongo, por grano y por sustrato, y lotes demorados.
- **Multicuenta**: los datos de cada cuenta están aislados.
- **Español e inglés**.

## Stack

| | |
|---|---|
| **App** | [Next.js 16](https://nextjs.org) (App Router, route handlers) · React 19 · TypeScript |
| **Datos** | MongoDB con [Mongoose](https://mongoosejs.com) (local o [Atlas](https://www.mongodb.com/atlas)) |
| **Monitoreo** | [InfluxDB 2.x](https://www.influxdata.com), leído solo del lado del servidor |
| **UI** | Tailwind CSS 4 · primitivas de [Base UI](https://base-ui.com) · íconos [Phosphor](https://phosphoricons.com) · gráficos en SVG propio y [Recharts](https://recharts.org) |
| **Formularios** | React Hook Form + Zod (los mismos schemas validan en el cliente y en la API) |
| **i18n** | [next-intl](https://next-intl.dev) |
| **Tests** | [Vitest](https://vitest.dev) contra una base MongoDB de test real |
| **Deploy** | [Vercel](https://vercel.com) |

La interfaz sigue el sistema de diseño propio **Kallampa**: oscuro, denso y con un solo color de acento, pensado para usar todos los días. Los tokens están en [`src/styles/kallampa/`](src/styles/kallampa/) y los componentes, en [`src/components/kallampa/`](src/components/kallampa/).

## Empezar

**Requisitos:** Node.js 20 o más y MongoDB corriendo en local.

```bash
git clone <url-del-repo>
cd sistema-coltro-cultivo-fungui
npm install
cp .env.example .env.local   # completá JWT_SECRET (openssl rand -hex 32)
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) para ver la landing, creá tu cuenta en `/registro` y cargá el inventario (hongos, granos y sustratos) para empezar tu primer lote.

### Variables de entorno

| Variable | Para qué |
|---|---|
| `MONGODB_URI` | Conexión a MongoDB (local o Atlas). |
| `JWT_SECRET` | Firma de las sesiones. |
| `REGISTRO_HABILITADO` | `true` permite crear cuentas nuevas. Sin definir, el registro queda abierto en desarrollo y **cerrado en producción**. |
| `INFLUX_URL`, `INFLUX_ORG`, `INFLUX_BUCKET`, `INFLUX_TOKEN` | Opcionales, para los gráficos de monitoreo. Sin ellas, el resto de la app funciona igual. |

`.env.example` tiene los detalles de cada una.

### Scripts

| Comando | |
|---|---|
| `npm run dev` | Servidor de desarrollo (puerto 3000, base `cultivo_hongos`). |
| `npm run dev:agent` | Servidor aparte (puerto 3099) contra una base descartable, para pruebas manuales o de agentes. |
| `npm test` | Suite de tests (usa su propia base `cultivo_hongos_test`, que se limpia sola). |
| `npm run lint` | ESLint. |
| `npm run build` | Build de producción. |

> Hay tres bases separadas con usos distintos: producción local, tests y pruebas descartables. Está explicado en [`CLAUDE.md`](CLAUDE.md).

## Estructura

```
src/
├── app/            # landing (/), páginas del panel (lotes, clonación, invernaderos, …) y API (app/api/**)
├── components/
│   ├── ui/         # primitivas (botón, diálogo, tabla…) con el estilo Kallampa
│   ├── kallampa/   # componentes del sistema de diseño (etapas, tags de estado, KPIs…)
│   ├── landing/    # secciones de la landing pública
│   ├── monitoreo/  # gráfico de barras SVG y tabla de ciclos
│   └── …           # componentes por módulo (batch, clonacion, invernaderos, stats…)
├── lib/            # validaciones, métricas, cliente de Influx, helpers
├── models/         # modelos de Mongoose
└── styles/kallampa # tokens de diseño
messages/           # textos en español e inglés
```

## Deploy

Producción corre en **Vercel** con **MongoDB Atlas**. Cada push a `master` despliega. La guía paso a paso (Atlas, variables y primer uso) está en [`DEPLOY.md`](DEPLOY.md).

## Pendientes

Las ideas y lo que el diseño ya muestra pero todavía no está implementado están en [`TODO.md`](TODO.md).

---

<div align="center">
<sub>Hecho por las cooperativas de trabajo <b>Teo</b> y <b>Lawal</b>.</sub>
</div>
