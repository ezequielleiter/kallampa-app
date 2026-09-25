// Migra los frascos de micelio liquido del viejo estado `valido` al nuevo
// `colonizado`: antes todo frasco nacia `valido` y ya se podia usar para un
// lote, asi que los existentes se consideran listos. Los nuevos nacen
// `colonizando`. Es idempotente: si no quedan `valido`, no hace nada.
// Uso: npm run db:migrate-frascos-colonizado  (corre con mongosh contra la base local)

const res = db.frascos_liquidos.updateMany(
  { estado: "valido" },
  { $set: { estado: "colonizado" } }
);
print(`frascos migrados valido -> colonizado: ${res.modifiedCount}`);
