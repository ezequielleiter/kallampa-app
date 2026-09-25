# Deploy a producción: Vercel + MongoDB Atlas

La app es un Next.js estándar: Vercel la detecta sola. La base es MongoDB Atlas (arranca vacía) y el monitoreo lee InfluxDB. Todo se configura con variables de entorno (ver `.env.example`). No hay deploys de preview: cada push a `master` va directo a producción.

## 1. MongoDB Atlas

1. Creá un cluster **M0** (gratis). Elegí la región cerca de donde corren las funciones de Vercel:
   - por defecto Vercel usa **`iad1`** (Washington) → cluster en **AWS us-east-1 (N. Virginia)**, o
   - si preferís São Paulo: en Vercel, *Settings → Functions → Function Region* = **`gru1`**, y el cluster en **AWS sa-east-1**.
2. **Database Access** → *Add New Database User*: usuario + clave, rol **`readWrite`** sobre la base **`cultivo_hongos`** (no admin).
3. **Network Access** → *Add IP Address* → **`0.0.0.0/0`** (Vercel no tiene IPs fijas; la protección es el usuario y la clave).
   Alternativa: la integración **MongoDB Atlas** del Marketplace de Vercel, que crea el acceso y carga `MONGODB_URI` sola.
4. *Connect → Drivers* → copiá el connection string y agregale el nombre de la base:
   `mongodb+srv://USUARIO:CLAVE@cluster.xxxxx.mongodb.net/cultivo_hongos?retryWrites=true&w=majority`

No hace falta crear colecciones ni índices: Mongoose los crea en la primera conexión. Los scripts `npm run db:*` son solo para la base local.

## 2. GitHub

1. Creá un repo **privado** vacío.
2. Desde este proyecto:
   ```bash
   git remote add origin git@github.com:TU_USUARIO/TU_REPO.git
   git push -u origin master
   ```

## 3. Vercel

1. *Add New → Project* → importá el repo. Framework: **Next.js** (detectado). Rama de producción: **`master`**.
2. *Settings → Git*: desactivá los deploys de preview (no se usan; así un push a otra rama no despliega nada).
3. *Settings → Environment Variables* (entorno **Production**):

   | Variable | Valor |
   |---|---|
   | `MONGODB_URI` | el connection string de Atlas del paso 1 |
   | `JWT_SECRET` | uno **nuevo**: `openssl rand -hex 32` (no reuses el local) |
   | `INFLUX_URL` | ej. `https://us-east-1-1.aws.cloud2.influxdata.com` |
   | `INFLUX_ORG` | tu organización de Influx |
   | `INFLUX_BUCKET` | ej. `cultivo` |
   | `INFLUX_TOKEN` | token con **lectura** sobre el bucket |
   | `REGISTRO_HABILITADO` | `true` (solo para crear tu cuenta, ver paso 4) |

4. *Deploy*.

## 4. Primer uso

1. Entrá a `https://TU-PROYECTO.vercel.app/registro` y creá tu cuenta.
2. En Vercel, **borrá `REGISTRO_HABILITADO`** (o ponelo en `false`) y hacé **Redeploy**: las variables solo se aplican en un deploy nuevo. Desde ahí `/registro` muestra "Registro cerrado" y la API rechaza altas.
3. Cargá el inventario (hongos, granos, sustratos) y los invernaderos.

## Notas

- **Sesiones**: duran 24 h. Cambiar `JWT_SECRET` cierra todas las sesiones.
- **Dispositivos de monitoreo**: los links `http://sensor-xxx.local` siguen abriendo desde la misma wifi (es navegación en otra pestaña; la app en HTTPS no les hace pedidos).
- **Monitoreo**: las rutas que consultan Influx tienen `maxDuration = 30` s. Si faltan las variables `INFLUX_*`, la sección muestra "no configurado" y el resto de la app funciona igual.
- **Logs**: *Vercel → Project → Logs*. El token de Influx nunca aparece en las respuestas ni en los errores.
- **Nueva cuenta más adelante**: repetí el paso 4 (habilitar, registrar, deshabilitar).
