// Borra los indices unicos globales que quedaron de antes del multi-cuenta
// (ej. `nombre_1`). Mongoose crea los nuevos `{ userId, ... }` pero nunca
// borra los viejos, y estos impiden repetir nombres/numeros entre cuentas.
// No toca documentos. Es idempotente: si el indice ya no existe, lo saltea.
// Uso: npm run db:drop-legacy-indexes  (corre con mongosh contra la base local)

const legacy = {
  fungus_types: ["nombre_1"],
  grain_types: ["nombre_1"],
  substrate_types: ["nombre_1"],
  batches: ["numeroLote_1"],
  clonaciones: ["numeroLote_1"],
  jars: ["numeroGuia_1"],
  frascos_liquidos: ["numeroGuia_1", "etiqueta_1"],
  placas: ["numeroPlaca_1"],
  recipientes: ["numeroSeguimiento_1"],
};

const collections = db.getCollectionNames();

for (const [col, names] of Object.entries(legacy)) {
  if (!collections.includes(col)) continue;
  const existing = db.getCollection(col).getIndexes().map((i) => i.name);
  for (const name of names) {
    if (existing.includes(name)) {
      db.getCollection(col).dropIndex(name);
      print(`borrado   ${col}.${name}`);
    } else {
      print(`no existe ${col}.${name}`);
    }
  }
}

print("\nIndices unicos restantes:");
for (const col of Object.keys(legacy)) {
  if (!collections.includes(col)) continue;
  const unique = db.getCollection(col).getIndexes().filter((i) => i.unique).map((i) => i.name);
  print(`  ${col}: ${unique.join(", ")}`);
}
