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

export interface ClonacionDoc extends Document {
  numeroLote: string;
  fungusTypeId: Types.ObjectId;
  colonizacion: Colonizacion;
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
    colonizacion: { type: colonizacionSchema, required: true },
  },
  { timestamps: true }
);

const Clonacion: Model<ClonacionDoc> =
  (mongoose.models.Clonacion as Model<ClonacionDoc>) ||
  mongoose.model<ClonacionDoc>("Clonacion", clonacionSchema, "clonaciones");

export default Clonacion;
