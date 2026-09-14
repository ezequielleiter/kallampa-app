// Corre antes de cada archivo de test (setupFiles, no confundir con
// globalSetup). Se conecta a la base de test y limpia las colecciones
// relevantes antes de CADA test individual, para que sean independientes
// entre si sin importar el orden en que corran.
import { beforeEach } from "vitest";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import Jar from "@/models/Jar";
import Recipiente from "@/models/Recipiente";
import FungusType from "@/models/FungusType";
import GrainType from "@/models/GrainType";
import SubstrateType from "@/models/SubstrateType";
import Counter from "@/models/Counter";

beforeEach(async () => {
  await dbConnect();
  await Promise.all([
    Batch.deleteMany({}),
    Jar.deleteMany({}),
    Recipiente.deleteMany({}),
    FungusType.deleteMany({}),
    GrainType.deleteMany({}),
    SubstrateType.deleteMany({}),
    Counter.deleteMany({}),
  ]);
});
