// Smoke test end-to-end contra la API real (requiere `next dev` corriendo
// en http://localhost:3000 y Mongo local levantado en MONGODB_URI).
//
// v2: ejercita el flujo de trazabilidad real -- crear un tipo de hongo (con
// diasEsperadosDefault de 3 campos), un tipo de grano y un tipo de sustrato
// -> crear un lote con 3 frascos -> marcar 2 como 'colonizado' -> crear un
// recipiente a partir de esos 2 (y confirmar que quedan 'usado') -> hacerlo
// fructificar -> agregarle 2 oleadas -> marcarlo 'finalizado' -> loguear
// resumenLote() via /api/stats.
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
  recipienteId: null,
  clonacionId: null,
  batchLiquidoId: null,
  recipienteLiquidoId: null,
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
      incubacion: 20,
      fructificacion: 3, // "3 dias esperados" pedido explicitamente para fructificacion
      colonizacionPlacas: 12,
    },
  });
  createdIds.fungusTypeId = fungusType._id;
  console.log("FungusType creado:", fungusType._id, fungusType.nombre);
  assert(
    fungusType.diasEsperadosDefault.fructificacion === 3 &&
      fungusType.diasEsperadosDefault.cosecha === undefined,
    "diasEsperadosDefault deberia tener solo 3 campos (sin 'cosecha')"
  );

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
    fechaInicio: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  });
  createdIds.batchId = batch._id;
  assert(batch.jars?.length === 3, "el lote deberia tener 3 jars");
  assert(/^L-\d{4}-\d{3}$/.test(batch.numeroLote), "numeroLote con formato invalido");
  assert(
    batch.jars.every((j) => j.numeroGuia.startsWith(`${batch.numeroLote}-F`)),
    "numeroGuia de los jars mal formado"
  );
  assert(batch.estado === undefined, "el batch v2 no deberia tener campo 'estado'");
  console.log("Batch creado:", batch.numeroLote);
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

  // 3. Marcar 2 de los 3 frascos como 'colonizado' (el 3ro queda 'colonizando')
  console.log("\n-- Colonizando 2 de los 3 frascos --");
  const [jar1, jar2] = batch.jars;
  await api("PATCH", `/api/jars/${jar1._id}`, { estado: "colonizado" });
  await api("PATCH", `/api/jars/${jar2._id}`, { estado: "colonizado" });

  const jarsColonizados = await api(
    "GET",
    `/api/jars?batchId=${batch._id}&estado=colonizado`
  );
  assert(jarsColonizados.length === 2, "deberian quedar 2 frascos colonizados");
  console.log("Frascos colonizados:", jarsColonizados.map((j) => j.numeroGuia).join(", "));

  // 4. Crear un recipiente a partir de esos 2 frascos
  console.log("\n-- Creando recipiente a partir de los 2 frascos colonizados --");
  const recipiente = await api("POST", "/api/recipientes", {
    batchId: batch._id,
    origenFrascoIds: [jar1._id, jar2._id],
    tipoSustratoId: substrateType._id,
    pesoSustratoKg: 20,
    precioPorKg: 100,
    fechaInicioIncubacion: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
  });
  createdIds.recipienteId = recipiente._id;
  assert(
    recipiente.numeroSeguimiento === `${batch.numeroLote}-R01`,
    `numeroSeguimiento esperado '${batch.numeroLote}-R01', fue '${recipiente.numeroSeguimiento}'`
  );
  assert(recipiente.estado === "incubando", "el recipiente deberia arrancar 'incubando'");
  assert(
    recipiente.diasEsperadosIncubacion === 20,
    "deberia haber tomado diasEsperadosDefault.incubacion del hongo"
  );
  console.log("Recipiente creado:", recipiente.numeroSeguimiento);

  // Confirmar que los 2 frascos de origen quedaron 'usado' y el 3ro sigue 'colonizando'
  const jarsDespues = await api("GET", `/api/jars?batchId=${batch._id}`);
  const jar1Despues = jarsDespues.find((j) => j._id === jar1._id);
  const jar2Despues = jarsDespues.find((j) => j._id === jar2._id);
  const jar3Despues = jarsDespues.find((j) => j._id === batch.jars[2]._id);
  assert(jar1Despues.estado === "usado", "jar1 deberia quedar 'usado'");
  assert(jar2Despues.estado === "usado", "jar2 deberia quedar 'usado'");
  assert(jar3Despues.estado === "colonizando", "jar3 (no usado) deberia seguir 'colonizando'");
  console.log("Frascos de origen marcados 'usado' OK; el 3ro sigue libre.");

  // Intento de crear un recipiente reusando un frasco ya 'usado' debe fallar con 409
  try {
    await api("POST", "/api/recipientes", {
      batchId: batch._id,
      origenFrascoIds: [jar1._id],
      tipoSustratoId: substrateType._id,
      pesoSustratoKg: 5,
      precioPorKg: 100,
      fechaInicioIncubacion: new Date().toISOString(),
    });
    throw new Error("Se esperaba que reusar un frasco 'usado' fallara");
  } catch (err) {
    assert(err.message.includes("409"), "reusar un frasco 'usado' deberia devolver 409");
    console.log("Reuso de frasco 'usado' rechazado correctamente (409) OK");
  }

  // 5. Fructificar el recipiente
  console.log("\n-- Pasando el recipiente a fructificacion --");
  const fructificado = await api(
    "POST",
    `/api/recipientes/${recipiente._id}/fructificar`,
    {
      fechaInicioFructificacion: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    }
  );
  assert(fructificado.estado === "fructificando", "no paso a 'fructificando'");
  assert(
    fructificado.diasEsperadosFructificacion === 3,
    "deberia haber tomado diasEsperadosDefault.fructificacion (3) del hongo"
  );
  console.log("Recipiente en fructificacion. diasEsperadosFructificacion:", fructificado.diasEsperadosFructificacion);

  // 6. Agregar 2 oleadas
  console.log("\n-- Agregando 2 oleadas --");
  await api("POST", `/api/recipientes/${recipiente._id}/oleadas`, {
    fecha: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    pesoKg: 3.5,
  });
  const conOleadas = await api("POST", `/api/recipientes/${recipiente._id}/oleadas`, {
    fecha: new Date().toISOString(),
    pesoKg: 2.5,
  });
  assert(conOleadas.oleadas?.length === 2, "deberian existir 2 oleadas");
  console.log(
    "Oleadas registradas:",
    conOleadas.oleadas.map((o) => `${o.fecha.slice(0, 10)}=${o.pesoKg}kg`).join(", ")
  );

  // 7. Marcar el recipiente como 'finalizado'
  console.log("\n-- Marcando el recipiente como finalizado --");
  const finalizado = await api("POST", `/api/recipientes/${recipiente._id}/estado`, {
    estado: "finalizado",
  });
  assert(finalizado.estado === "finalizado", "el recipiente deberia quedar 'finalizado'");
  console.log("Recipiente finalizado OK.");

  // Marcarlo de nuevo (estado terminal) debe fallar con 409
  try {
    await api("POST", `/api/recipientes/${recipiente._id}/estado`, {
      estado: "contaminado",
    });
    throw new Error("Se esperaba que re-marcar un recipiente terminal fallara");
  } catch (err) {
    assert(err.message.includes("409"), "re-marcar un estado terminal deberia devolver 409");
    console.log("Re-marcado de estado terminal rechazado correctamente (409) OK");
  }

  // 8. Detalle del lote (jars + recipientes)
  console.log("\n-- Detalle del lote --");
  const detail = await api("GET", `/api/batches/${batch._id}`);
  assert(detail.jars?.length === 3, "el detalle deberia traer los 3 jars");
  assert(detail.recipientes?.length === 1, "el detalle deberia traer el recipiente creado");
  assert(
    detail.recipientes[0].origenFrascoIds.every((f) => typeof f === "object" && f.numeroGuia),
    "origenFrascoIds deberia venir poblado (liviano) con numeroGuia"
  );
  console.log("Detalle OK: jars =", detail.jars.length, ", recipientes =", detail.recipientes.length);

  // El lote sigue 'en_progreso' segun /api/batches porque el 3er frasco
  // quedo 'colonizando' (nunca se convirtio en recipiente).
  const listado = await api("GET", "/api/batches");
  const loteEnListado = listado.find((b) => b._id === batch._id);
  assert(loteEnListado, "el lote deberia aparecer en GET /api/batches");
  assert(
    loteEnListado.estadoDerivado === "en_progreso",
    `estadoDerivado esperado 'en_progreso' (frasco 3 sigue colonizando), fue '${loteEnListado.estadoDerivado}'`
  );
  console.log("estadoDerivado en listado:", loteEnListado.estadoDerivado, "(correcto: queda un frasco colonizando)");

  // 9. Flujo de Clonacion: placas -> frascos liquidos -> recipiente
  console.log("\n-- Clonacion: creando 2 placas --");
  const clonacion = await api("POST", "/api/clonaciones", {
    fungusTypeId: fungusType._id,
    cantidadPlacas: 2,
    fechaInicio: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
  });
  createdIds.clonacionId = clonacion._id;
  assert(/^C-\d{4}-\d{3}$/.test(clonacion.numeroLote), "numeroLote de clonacion con formato invalido");
  assert(clonacion.placas?.length === 2, "la clonacion deberia tener 2 placas");
  assert(
    clonacion.colonizacion.diasEsperados === 12,
    "deberia haber tomado diasEsperadosDefault.colonizacionPlacas (12) del hongo"
  );
  console.log("Clonacion creada:", clonacion.numeroLote, "placas:", clonacion.placas.map((p) => p.numeroPlaca).join(", "));

  const [placa1] = clonacion.placas;
  await api("PATCH", `/api/placas/${placa1._id}`, { estado: "colonizado" });
  console.log("Placa 1 colonizada:", placa1.numeroPlaca);

  console.log("\n-- Creando 2 frascos liquidos desde la MISMA placa --");
  const fl1 = await api("POST", "/api/frascos-liquidos", {
    origenPlacaId: placa1._id,
    fechaCreacion: new Date().toISOString(),
  });
  const fl2 = await api("POST", "/api/frascos-liquidos", {
    origenPlacaId: placa1._id,
    fechaCreacion: new Date().toISOString(),
  });
  assert(fl1.etiqueta === `${clonacion.numeroLote}-L01`, "etiqueta de fl1 mal formada");
  assert(fl2.etiqueta === `${clonacion.numeroLote}-L02`, "etiqueta de fl2 mal formada");
  console.log("Frascos liquidos creados (misma placa reusada):", fl1.etiqueta, fl2.etiqueta);

  const placaDespues = await api("GET", `/api/placas?clonacionId=${clonacion._id}`);
  assert(
    placaDespues.find((p) => p._id === placa1._id).estado === "colonizado",
    "la placa de origen no deberia cambiar de estado al usarse"
  );
  console.log("Placa de origen sigue 'colonizado' (no se consume) OK");

  // Usamos un batch separado (no el `batch` principal) para no alterar los
  // numeros de resumenLote()/stats que se verifican mas abajo con datos
  // fijos.
  console.log("\n-- Creando un recipiente SOLO con origen liquido (batch separado) --");
  const batchLiquido = await api("POST", "/api/batches", {
    fungusTypeId: fungusType._id,
    tipoGranoId: grainType._id,
    pesoGranoKg: 1,
    precioPorKg: 500,
    cantidadFrascos: 1,
    fechaInicio: new Date().toISOString(),
  });
  createdIds.batchLiquidoId = batchLiquido._id;

  const recipienteLiquido = await api("POST", "/api/recipientes", {
    batchId: batchLiquido._id,
    origenFrascosLiquidosIds: [fl1._id],
    tipoSustratoId: substrateType._id,
    pesoSustratoKg: 5,
    precioPorKg: 100,
    fechaInicioIncubacion: new Date().toISOString(),
  });
  createdIds.recipienteLiquidoId = recipienteLiquido._id;
  assert(
    recipienteLiquido.origenFrascoIds.length === 0 &&
      recipienteLiquido.origenFrascosLiquidosIds[0] === fl1._id,
    "el recipiente deberia haberse creado solo con origen liquido"
  );
  console.log("Recipiente creado solo con frasco liquido:", recipienteLiquido.numeroSeguimiento);

  // Un recipiente sin ningun origen debe fallar con 400 (Zod)
  try {
    await api("POST", "/api/recipientes", {
      batchId: batchLiquido._id,
      tipoSustratoId: substrateType._id,
      pesoSustratoKg: 5,
      precioPorKg: 100,
      fechaInicioIncubacion: new Date().toISOString(),
    });
    throw new Error("Se esperaba que un recipiente sin origen fallara");
  } catch (err) {
    assert(err.message.includes("400"), "recipiente sin origen deberia devolver 400");
    console.log("Recipiente sin ningun origen rechazado correctamente (400) OK");
  }

  // 9. resumenLote() via /api/stats
  console.log("\n-- resumenLote() via /api/stats --");
  const stats = await api("GET", "/api/stats");
  const loteStats = stats.lotes.find((l) => l.numeroLote === batch.numeroLote);
  assert(loteStats, "el lote deberia aparecer en /api/stats");
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

  console.log("\n== Smoke test OK: todos los asserts pasaron ==");
}

async function cleanup() {
  console.log("\n-- Limpiando datos de prueba --");
  const mongoose = (await import("mongoose")).default;
  const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/cultivo_hongos";
  await mongoose.connect(uri);

  const db = mongoose.connection.db;

  if (createdIds.batchId) {
    await db.collection("jars").deleteMany({
      batchId: new mongoose.Types.ObjectId(createdIds.batchId),
    });
    await db.collection("recipientes").deleteMany({
      batchId: new mongoose.Types.ObjectId(createdIds.batchId),
    });
    await db.collection("batches").deleteOne({
      _id: new mongoose.Types.ObjectId(createdIds.batchId),
    });
  }
  if (createdIds.batchLiquidoId) {
    await db.collection("jars").deleteMany({
      batchId: new mongoose.Types.ObjectId(createdIds.batchLiquidoId),
    });
    await db.collection("recipientes").deleteMany({
      batchId: new mongoose.Types.ObjectId(createdIds.batchLiquidoId),
    });
    await db.collection("batches").deleteOne({
      _id: new mongoose.Types.ObjectId(createdIds.batchLiquidoId),
    });
  }
  if (createdIds.clonacionId) {
    await db.collection("placas").deleteMany({
      clonacionId: new mongoose.Types.ObjectId(createdIds.clonacionId),
    });
    await db.collection("frascos_liquidos").deleteMany({
      clonacionId: new mongoose.Types.ObjectId(createdIds.clonacionId),
    });
    await db.collection("clonaciones").deleteOne({
      _id: new mongoose.Types.ObjectId(createdIds.clonacionId),
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
