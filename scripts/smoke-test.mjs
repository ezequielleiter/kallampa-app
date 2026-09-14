// Smoke test end-to-end contra la API real (requiere `next dev` corriendo
// en http://localhost:3000 y Mongo local levantado en MONGODB_URI).
//
// Ejercita: catalogos -> crear lote con 3 frascos -> avanzar por las 4
// etapas -> agregar 2 oleadas -> resumen de metricas -> busqueda de frasco
// por numeroGuia -> descarte de un lote de prueba aparte.
//
// Al final borra todos los documentos que creo (usa un sufijo unico por
// corrida en los nombres de catalogo para no chocar con datos reales, y
// limpia por _id al terminar).
//
// Uso: node scripts/smoke-test.mjs   (con `next dev` corriendo aparte)

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const RUN_ID = Date.now();

const createdIds = {
  fungusTypeId: null,
  grainTypeId: null,
  substrateTypeId: null,
  batchId: null,
  discardBatchId: null,
};

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `${method} ${path} -> ${res.status}: ${json.error ?? JSON.stringify(json)}`
    );
  }
  return json.data;
}

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`);
}

async function main() {
  console.log(`== Smoke test contra ${BASE} (run ${RUN_ID}) ==`);

  // 1. Catalogos
  console.log("\n-- Creando catalogos --");
  const fungusType = await api("POST", "/api/fungus-types", {
    nombre: `Smoke Hongo ${RUN_ID}`,
    nombreCientifico: "Pleurotus smoketest",
    diasEsperadosDefault: {
      inoculacionGrano: 14,
      crecimientoSustrato: 20,
      fructificacion: 10,
      cosecha: 15,
    },
  });
  createdIds.fungusTypeId = fungusType._id;
  console.log("FungusType creado:", fungusType._id, fungusType.nombre);

  const grainType = await api("POST", "/api/grain-types", {
    nombre: `Smoke Grano ${RUN_ID}`,
  });
  createdIds.grainTypeId = grainType._id;
  console.log("GrainType creado:", grainType._id, grainType.nombre);

  const substrateType = await api("POST", "/api/substrate-types", {
    nombre: `Smoke Sustrato ${RUN_ID}`,
  });
  createdIds.substrateTypeId = substrateType._id;
  console.log("SubstrateType creado:", substrateType._id, substrateType.nombre);

  // 2. Crear lote con 3 frascos
  console.log("\n-- Creando lote con 3 frascos --");
  const batch = await api("POST", "/api/batches", {
    fungusTypeId: fungusType._id,
    tipoGranoId: grainType._id,
    pesoGranoKg: 10,
    precioPorKg: 500,
    cantidadFrascos: 3,
    fechaInicio: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
  });
  createdIds.batchId = batch._id;
  assert(batch.jars?.length === 3, "el lote deberia tener 3 jars");
  assert(/^L-\d{4}-\d{3}$/.test(batch.numeroLote), "numeroLote con formato invalido");
  assert(
    batch.jars.every((j) => j.numeroGuia.startsWith(`${batch.numeroLote}-F`)),
    "numeroGuia de los jars mal formado"
  );
  console.log("Batch creado:", batch.numeroLote, "estado:", batch.estado);
  console.log(
    "Jars:",
    batch.jars.map((j) => j.numeroGuia).join(", ")
  );

  // 2b. Busqueda de frasco por numeroGuia (case-insensitive)
  const firstJarGuia = batch.jars[0].numeroGuia;
  const jarSearch = await api(
    "GET",
    `/api/jars/search?numeroGuia=${encodeURIComponent(firstJarGuia.toLowerCase())}`
  );
  assert(jarSearch.numeroGuia === firstJarGuia, "busqueda de jar no encontro el correcto");
  assert(jarSearch.batch?.numeroLote === batch.numeroLote, "el jar no trajo el batch esperado");
  console.log("Busqueda de jar OK (case-insensitive):", jarSearch.numeroGuia);

  // Cambiar estado de un jar
  const jarUpdated = await api("PATCH", `/api/jars/${batch.jars[0]._id}`, {
    estado: "colonizado",
  });
  assert(jarUpdated.estado === "colonizado", "no se actualizo el estado del jar");
  console.log("Jar actualizado a estado:", jarUpdated.estado);

  // 3. Avanzar por las 4 etapas
  console.log("\n-- Avanzando etapas --");
  const toSustrato = await api("POST", `/api/batches/${batch._id}/advance-stage`, {
    targetStage: "crecimiento_sustrato",
    tipoSustratoId: substrateType._id,
    kilosSustrato: 20,
    precioPorKg: 100,
    fechaInicio: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
  });
  assert(toSustrato.estado === "crecimiento_sustrato", "no avanzo a crecimiento_sustrato");
  console.log("Avanzo a:", toSustrato.estado);

  const toFructificacion = await api(
    "POST",
    `/api/batches/${batch._id}/advance-stage`,
    {
      targetStage: "fructificacion",
      fechaInicio: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
      recipientes: [
        { codigo: "R1", pesoKg: 5 },
        { codigo: "R2", pesoKg: 5 },
      ],
    }
  );
  assert(toFructificacion.estado === "fructificacion", "no avanzo a fructificacion");
  console.log("Avanzo a:", toFructificacion.estado);

  const toCosecha = await api("POST", `/api/batches/${batch._id}/advance-stage`, {
    targetStage: "cosecha",
    fechaInicio: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  });
  assert(toCosecha.estado === "cosecha", "no avanzo a cosecha");
  console.log("Avanzo a:", toCosecha.estado);

  // Intento de salto de etapa invalido (cosecha -> crecimiento_sustrato) debe fallar con 409
  try {
    await api("POST", `/api/batches/${batch._id}/advance-stage`, {
      targetStage: "crecimiento_sustrato",
      tipoSustratoId: substrateType._id,
      kilosSustrato: 1,
      precioPorKg: 1,
      fechaInicio: new Date().toISOString(),
    });
    throw new Error("Se esperaba que la transicion invalida fallara");
  } catch (err) {
    assert(err.message.includes("409"), "la transicion invalida deberia devolver 409");
    console.log("Transicion invalida rechazada correctamente (409) OK");
  }

  // 4. Agregar 2 oleadas
  console.log("\n-- Agregando oleadas --");
  await api("POST", `/api/batches/${batch._id}/flushes`, {
    numero: 1,
    fecha: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    pesoKg: 3.5,
  });
  const afterFlush2 = await api("POST", `/api/batches/${batch._id}/flushes`, {
    numero: 2,
    fecha: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    pesoKg: 2.5,
  });
  assert(afterFlush2.oleadas?.length === 2, "deberian existir 2 oleadas");
  console.log(
    "Oleadas registradas:",
    afterFlush2.oleadas.map((o) => `#${o.numero}=${o.pesoKg}kg`).join(", ")
  );

  // 5. Finalizar lote
  const finalizado = await api("POST", `/api/batches/${batch._id}/advance-stage`, {
    targetStage: "finalizado",
  });
  assert(finalizado.estado === "finalizado", "no finalizo el lote");
  assert(finalizado.cosecha?.fechaFin, "cosecha.fechaFin deberia estar seteada al finalizar");
  console.log("Lote finalizado. cosecha.fechaFin:", finalizado.cosecha.fechaFin);

  // 6. Detalle del lote + resumen via /api/stats
  console.log("\n-- Detalle del lote y metricas --");
  const detail = await api("GET", `/api/batches/${batch._id}`);
  assert(detail.jars?.length === 3, "el detalle deberia traer los 3 jars");
  console.log("Detalle OK, jars:", detail.jars.length);

  const stats = await api("GET", "/api/stats");
  const loteStats = stats.lotes.find((l) => l.numeroLote === batch.numeroLote);
  assert(loteStats, "el lote deberia aparecer en /api/stats");
  console.log("\nresumenLote() para", batch.numeroLote, ":");
  console.log(JSON.stringify(loteStats.resumen, null, 2));

  assert(
    loteStats.resumen.pesoTotalCosechado === 6,
    `pesoTotalCosechado deberia ser 6, fue ${loteStats.resumen.pesoTotalCosechado}`
  );
  assert(
    Math.abs(loteStats.resumen.eficienciaBiologica - 30) < 0.001,
    `eficienciaBiologica deberia ser 30 (6/20*100), fue ${loteStats.resumen.eficienciaBiologica}`
  );
  const costoEsperado = 10 * 500 + 20 * 100; // 5000 + 2000 = 7000
  assert(
    loteStats.resumen.costoProduccion.costoTotal === costoEsperado,
    `costoTotal esperado ${costoEsperado}, fue ${loteStats.resumen.costoProduccion.costoTotal}`
  );
  console.log("\nKPIs generales de /api/stats:");
  console.log(JSON.stringify(stats.kpis, null, 2));

  // 7. Flujo de descarte (lote aparte, mas simple)
  console.log("\n-- Probando flujo de descarte --");
  const discardBatch = await api("POST", "/api/batches", {
    fungusTypeId: fungusType._id,
    tipoGranoId: grainType._id,
    pesoGranoKg: 5,
    precioPorKg: 200,
    cantidadFrascos: 1,
    fechaInicio: new Date().toISOString(),
  });
  createdIds.discardBatchId = discardBatch._id;
  const discarded = await api("POST", `/api/batches/${discardBatch._id}/discard`, {
    motivo: "Contaminacion detectada (prueba de smoke test)",
  });
  assert(discarded.estado === "descartado", "el lote deberia quedar descartado");
  assert(discarded.descartado === true, "descartado deberia ser true");
  console.log("Lote de prueba descartado OK:", discarded.numeroLote);

  console.log("\n== Smoke test OK: todos los asserts pasaron ==");
}

async function cleanup() {
  console.log("\n-- Limpiando datos de prueba --");
  // Borrado directo via mongoose (no hay DELETE fisico en la API para
  // catalogos/batches por diseno, asi que limpiamos con un driver aparte).
  const mongoose = (await import("mongoose")).default;
  const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/cultivo_hongos";
  await mongoose.connect(uri);

  const db = mongoose.connection.db;

  if (createdIds.batchId) {
    await db.collection("jars").deleteMany({
      batchId: new mongoose.Types.ObjectId(createdIds.batchId),
    });
    await db.collection("batches").deleteOne({
      _id: new mongoose.Types.ObjectId(createdIds.batchId),
    });
  }
  if (createdIds.discardBatchId) {
    await db.collection("jars").deleteMany({
      batchId: new mongoose.Types.ObjectId(createdIds.discardBatchId),
    });
    await db.collection("batches").deleteOne({
      _id: new mongoose.Types.ObjectId(createdIds.discardBatchId),
    });
  }
  if (createdIds.fungusTypeId) {
    await db.collection("fungus_types").deleteOne({
      _id: new mongoose.Types.ObjectId(createdIds.fungusTypeId),
    });
  }
  if (createdIds.grainTypeId) {
    await db.collection("grain_types").deleteOne({
      _id: new mongoose.Types.ObjectId(createdIds.grainTypeId),
    });
  }
  if (createdIds.substrateTypeId) {
    await db.collection("substrate_types").deleteOne({
      _id: new mongoose.Types.ObjectId(createdIds.substrateTypeId),
    });
  }

  await mongoose.disconnect();
  console.log("Limpieza completa.");
}

main()
  .then(async () => {
    await cleanup();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("\n!! Smoke test FALLO:", err);
    try {
      await cleanup();
    } catch (cleanupErr) {
      console.error("Ademas fallo la limpieza:", cleanupErr);
    }
    process.exit(1);
  });
