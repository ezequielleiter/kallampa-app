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

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Falta la variable de entorno MONGODB_URI (definila en .env.local)"
  );
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
    cached.promise = mongoose.connect(MONGODB_URI as string, {
      bufferCommands: false,
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
