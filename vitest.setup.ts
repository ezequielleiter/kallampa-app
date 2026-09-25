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
import Clonacion from "@/models/Clonacion";
import Placa from "@/models/Placa";
import FrascoLiquido from "@/models/FrascoLiquido";
import Nota from "@/models/Nota";
import Tarea from "@/models/Tarea";
import User from "@/models/User";
import Invernadero from "@/models/Invernadero";

beforeEach(async () => {
  await dbConnect();
  await Promise.all([
    User.deleteMany({}),
    Invernadero.deleteMany({}),
    Batch.deleteMany({}),
    Jar.deleteMany({}),
    Recipiente.deleteMany({}),
    FungusType.deleteMany({}),
    GrainType.deleteMany({}),
    SubstrateType.deleteMany({}),
    Counter.deleteMany({}),
    Clonacion.deleteMany({}),
    Placa.deleteMany({}),
    FrascoLiquido.deleteMany({}),
    Nota.deleteMany({}),
    Tarea.deleteMany({}),
  ]);
});
