// Global setup/teardown de Vitest (corre una sola vez para toda la corrida,
// en un proceso aparte del que ejecuta los tests).
//
// Se encarga de dejar `cultivo_hongos_test` limpia ANTES de correr (por si
// quedo basura de una corrida anterior interrumpida) y de borrarla
// COMPLETA al terminar, para no dejar nada residual. Nunca toca
// `cultivo_hongos` (la base real) ni ninguna otra base del sistema: la URI
// esta hardcodeada a la base de test.
import { MongoClient } from "mongodb";
import { TEST_MONGODB_URI } from "./vitest.config";

export async function setup() {
  const client = new MongoClient(TEST_MONGODB_URI);
  try {
    await client.connect();
    await client.db().dropDatabase();
  } finally {
    await client.close();
  }
}

export async function teardown() {
  const client = new MongoClient(TEST_MONGODB_URI);
  try {
    await client.connect();
    await client.db().dropDatabase();
  } finally {
    await client.close();
  }
}
