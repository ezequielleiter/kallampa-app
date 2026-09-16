import mongoose, { Schema, Document, Model, Types } from "mongoose";

/**
 * Clonacion: flujo paralelo a Batch (produccion en grano). Se coloniza un
 * conjunto de placas de Petri a partir de una cepa (fungusTypeId), y de esas
 * placas se sacan frascos de micelio liquido (FrascoLiquido) que a su vez
 * pueden usarse como origen de un Recipiente (junto con o en vez de Jars).
 */

export interface Colonizacion {
  cantidadPlacas: number;
  fechaInicio: Date;
  diasEsperados: number;
}

// Los 3 caminos por los que puede empezar una Clonacion: "placa" (el flujo
// de siempre, coloniza N Placas de Petri antes de sacar frascos), o directo
// a frascos de micelio liquido sin pasar por placas -- "comprado" (sin
// origen interno) o "frascoGrano" (origen obligatorio: un Jar de
// Produccion ya colonizado/usado).
export const ORIGEN_PROCESO = ["placa", "comprado", "frascoGrano"] as const;
export type OrigenProceso = (typeof ORIGEN_PROCESO)[number];

export interface ClonacionDoc extends Document {
  numeroLote: string;
  fungusTypeId: Types.ObjectId;
  origenProceso: OrigenProceso;
  // Fecha de inicio comun a los 3 caminos (el listado/detalle la necesitan
  // sin ir a buscarla adentro de `colonizacion`, que solo existe para el
  // camino "placa"). `colonizacion.fechaInicio` se mantiene intacto para
  // ese camino.
  fechaInicio: Date;
  // Trazabilidad inversa a Batch.origenFrascoLiquidoId: una clonacion se
  // puede iniciar eligiendo el hongo directamente, O a partir de un Jar ya
  // colonizado/usado, O de un Recipiente fructificando (el operador
  // "clona" una cepa puntual que le esta rindiendo bien). Opcionales, sin
  // default, y NO cambian el estado del jar/recipiente de origen al
  // usarse -- se pueden reusar para clonar mas de una vez.
  origenTipo?: "jar" | "recipiente";
  origenJarId?: Types.ObjectId;
  origenRecipienteId?: Types.ObjectId;
  // Denormalizado desde el jar/recipiente de origen, para reconstruir el
  // arbol Lote -> Clonacion -> Lote sin tener que resolver batchId a traves
  // del jar/recipiente (que podria borrarse/cambiar mas adelante).
  origenBatchId?: Types.ObjectId;
  // Solo presente en el camino "placa".
  colonizacion?: Colonizacion;
  // Solo presente en los caminos "comprado"/"frascoGrano": cantidad de
  // FrascoLiquido creados de una sola vez al crear la clonacion.
  cantidadFrascos?: number;
  // Nota libre, no obligatoria: la receta de agar usada para las placas de
  // esta clonación (proporciones, marca, aditivos, etc.), a gusto del
  // operador.
  recetaAgar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const colonizacionSchema = new Schema<Colonizacion>(
  {
    cantidadPlacas: { type: Number, required: true },
    fechaInicio: { type: Date, required: true },
    diasEsperados: { type: Number, required: true },
  },
  { _id: false }
);

const clonacionSchema = new Schema<ClonacionDoc>(
  {
    numeroLote: { type: String, required: true, unique: true },
    fungusTypeId: {
      type: Schema.Types.ObjectId,
      ref: "FungusType",
      required: true,
      index: true,
    },
    origenProceso: {
      type: String,
      enum: ORIGEN_PROCESO,
      required: true,
      default: "placa",
    },
    fechaInicio: { type: Date, required: true },
    origenTipo: { type: String, enum: ["jar", "recipiente"] },
    origenJarId: { type: Schema.Types.ObjectId, ref: "Jar" },
    origenRecipienteId: { type: Schema.Types.ObjectId, ref: "Recipiente" },
    origenBatchId: { type: Schema.Types.ObjectId, ref: "Batch" },
    colonizacion: { type: colonizacionSchema, required: false },
    cantidadFrascos: { type: Number },
    recetaAgar: { type: String },
  },
  { timestamps: true }
);

const Clonacion: Model<ClonacionDoc> =
  (mongoose.models.Clonacion as Model<ClonacionDoc>) ||
  mongoose.model<ClonacionDoc>("Clonacion", clonacionSchema, "clonaciones");

export default Clonacion;
