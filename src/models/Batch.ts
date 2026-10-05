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

// Comentarios libres sobre el lote (bitacora), en un hilo cronologico
// dentro del detalle. No tienen relacion con las Notas (wiki general).
export interface Comentario {
  _id: Types.ObjectId;
  texto: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BatchDoc extends Document {
  userId: Types.ObjectId;
  numeroLote: string;
  fungusTypeId: Types.ObjectId;
  // Si el lote se inicio a partir de un frasco de micelio liquido de
  // Clonacion (en vez de elegir el tipo de hongo directamente), queda
  // registrado aca para trazabilidad. fungusTypeId siempre se completa (se
  // deriva del frasco cuando este campo esta presente).
  origenFrascoLiquidoId?: Types.ObjectId;
  inoculacionGrano: InoculacionGrano;
  comentarios: Types.DocumentArray<Comentario>;
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

const comentarioSchema = new Schema<Comentario>(
  { texto: { type: String, required: true, trim: true } },
  { timestamps: true }
);

const batchSchema = new Schema<BatchDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    numeroLote: { type: String, required: true },
    fungusTypeId: {
      type: Schema.Types.ObjectId,
      ref: "FungusType",
      required: true,
      index: true,
    },
    origenFrascoLiquidoId: {
      type: Schema.Types.ObjectId,
      ref: "FrascoLiquido",
    },
    inoculacionGrano: { type: inoculacionGranoSchema, required: true },
    comentarios: { type: [comentarioSchema], default: [] },
  },
  { timestamps: true }
);

batchSchema.index({ userId: 1, numeroLote: 1 }, { unique: true });

const Batch: Model<BatchDoc> =
  (mongoose.models.Batch as Model<BatchDoc>) ||
  mongoose.model<BatchDoc>("Batch", batchSchema, "batches");

export default Batch;
