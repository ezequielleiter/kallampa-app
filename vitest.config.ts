import { defineConfig } from "vitest/config";
import path from "node:path";

// Base de datos de test separada de la real (cultivo_hongos) y de las
// demas bases del sistema. Se usa Mongo local standalone real, no una
// base en memoria (ver instrucciones del proyecto).
export const TEST_MONGODB_URI = "mongodb://127.0.0.1:27017/cultivo_hongos_test";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    globalSetup: ["./vitest.global-setup.ts"],
    setupFiles: ["./vitest.setup.ts"],
    env: {
      MONGODB_URI: TEST_MONGODB_URI,
      JWT_SECRET: "test-jwt-secret-nunca-usar-en-produccion",
    },
    // Los tests de integracion comparten una unica base de test; se
    // ejecutan los archivos secuencialmente para que la limpieza
    // (beforeEach/afterEach) de cada uno no se pise con la de otro que
    // corra en paralelo.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
