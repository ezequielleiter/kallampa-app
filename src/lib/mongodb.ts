import mongoose from "mongoose";

// Side-effect imports: registran cada modelo en mongoose.models antes de
// que cualquier ruta haga populate() sobre su `ref`. Sin esto, una ruta que
// nunca importa un modelo referenciado (ej. GrainType desde batches/[id])
// dispara MissingSchemaError al popular ese campo, aunque el modelo sí
// exista en el proyecto — el registro es por proceso, no por import local.
import "@/models/User";
import "@/models/Counter";
import "@/models/FungusType";
import "@/models/GrainType";
import "@/models/SubstrateType";
import "@/models/Batch";
import "@/models/Jar";
import "@/models/Recipiente";
import "@/models/Clonacion";
import "@/models/Placa";
import "@/models/FrascoLiquido";
import "@/models/Nota";
import "@/models/Tarea";
import "@/models/Invernadero";

// La variable se lee recien al conectar (no al importar el modulo): el build
// de produccion (p. ej. en Vercel) importa las rutas sin necesitar la base.
function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Falta la variable de entorno MONGODB_URI (definila en .env.local o en las variables de entorno del deploy)"
    );
  }
  return uri;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global._mongooseCache) {
  global._mongooseCache = cached;
}

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(getMongoUri(), {
      bufferCommands: false,
      // Serverless (Vercel) contra Atlas: pool chico por instancia y falla
      // rapido si el cluster no es accesible (en vez de colgar la funcion).
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default dbConnect;
