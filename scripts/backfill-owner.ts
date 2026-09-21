/**
 * Backfill standalone: asigna `userId` a todos los documentos "huerfanos"
 * (sin userId, de antes del retrofit de auth) de los 11 modelos "owned" del
 * sistema, para una cuenta puntual.
 *
 * Uso: npx tsx scripts/backfill-owner.ts <email>
 *
 * No usa el dbConnect cacheado de src/lib/mongodb.ts (pensado para el
 * runtime de Next con hot-reload) -- se conecta directo con
 * mongoose.connect() usando MONGODB_URI y desconecta al final. Idempotente:
 * correrlo de nuevo no rompe nada, los documentos que ya tienen userId
 * simplemente no matchean el filtro `{ userId: { $exists: false } }`.
 */
import mongoose from "mongoose";
import User from "../src/models/User";
import Batch from "../src/models/Batch";
import Clonacion from "../src/models/Clonacion";
import FrascoLiquido from "../src/models/FrascoLiquido";
import Jar from "../src/models/Jar";
import Placa from "../src/models/Placa";
import Recipiente from "../src/models/Recipiente";
import FungusType from "../src/models/FungusType";
import GrainType from "../src/models/GrainType";
import SubstrateType from "../src/models/SubstrateType";
import Nota from "../src/models/Nota";
import Tarea from "../src/models/Tarea";

const OWNED_MODELS: { name: string; model: mongoose.Model<Record<string, unknown>> }[] = [
  { name: "Batch", model: Batch },
  { name: "Clonacion", model: Clonacion },
  { name: "FrascoLiquido", model: FrascoLiquido },
  { name: "Jar", model: Jar },
  { name: "Placa", model: Placa },
  { name: "Recipiente", model: Recipiente },
  { name: "FungusType", model: FungusType },
  { name: "GrainType", model: GrainType },
  { name: "SubstrateType", model: SubstrateType },
  { name: "Nota", model: Nota },
  { name: "Tarea", model: Tarea },
] as unknown as { name: string; model: mongoose.Model<Record<string, unknown>> }[];

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Uso: npx tsx scripts/backfill-owner.ts <email>");
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Falta la variable de entorno MONGODB_URI");
    process.exit(1);
  }

  await mongoose.connect(uri);

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.error(`No existe ningun usuario con email '${email}'`);
      process.exitCode = 1;
      return;
    }

    console.log(`Asignando documentos huerfanos a ${user.username} (${user.email}, _id=${user._id})...`);

    for (const { name, model } of OWNED_MODELS) {
      const result = await model.updateMany(
        { userId: { $exists: false } },
        { $set: { userId: user._id } }
      );
      console.log(`  ${name}: ${result.modifiedCount} documento(s) actualizado(s)`);
    }

    console.log("Backfill completado.");
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
