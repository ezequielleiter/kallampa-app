import mongoose, { Schema, Document, Model, Types } from "mongoose";

/**
 * v2: el Batch dejo de ser una maquina de estados. Es un contenedor de
 * trazabilidad: agrupa los Jars (frascos de grano) y, transitivamente via
 * Recipiente.batchId, los recipientes de sustrato que se armaron a partir
 * de esos frascos. Ya no tiene `estado` persistido -- se calcula (ver
 * `estadoLote` en src/lib/metrics.ts) a partir de si le queda algo activo
 * entre sus frascos y recipientes.
 */

export interface InoculacionGrano {
  tipoGranoId: Types.ObjectId;
  pesoGranoKg: number;
  precioPorKg: number;
  cantidadFrascos: number;
  fechaInicio: Date;
  diasEsperados: number;
}

export interface BatchDoc extends Document {
  numeroLote: string;
  fungusTypeId: Types.ObjectId;
  inoculacionGrano: InoculacionGrano;
  createdAt: Date;
  updatedAt: Date;
}

const inoculacionGranoSchema = new Schema<InoculacionGrano>(
  {
    tipoGranoId: { type: Schema.Types.ObjectId, ref: "GrainType", required: true },
    pesoGranoKg: { type: Number, required: true },
    precioPorKg: { type: Number, required: true },
    cantidadFrascos: { type: Number, required: true },
    fechaInicio: { type: Date, required: true },
    diasEsperados: { type: Number, required: true },
  },
  { _id: false }
);

const batchSchema = new Schema<BatchDoc>(
  {
    numeroLote: { type: String, required: true, unique: true },
    fungusTypeId: {
      type: Schema.Types.ObjectId,
      ref: "FungusType",
      required: true,
      index: true,
    },
    inoculacionGrano: { type: inoculacionGranoSchema, required: true },
  },
  { timestamps: true }
);

const Batch: Model<BatchDoc> =
  (mongoose.models.Batch as Model<BatchDoc>) ||
  mongoose.model<BatchDoc>("Batch", batchSchema, "batches");

export default Batch;
