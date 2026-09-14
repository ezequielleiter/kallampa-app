import mongoose, { Schema, Document, Model } from "mongoose";

export interface DiasEsperadosDefault {
  inoculacionGrano: number;
  incubacion: number;
  fructificacion: number;
}

export interface FungusTypeDoc extends Document {
  nombre: string;
  nombreCientifico?: string;
  notas?: string;
  activo: boolean;
  diasEsperadosDefault: DiasEsperadosDefault;
  createdAt: Date;
  updatedAt: Date;
}

const diasEsperadosDefaultSchema = new Schema<DiasEsperadosDefault>(
  {
    inoculacionGrano: { type: Number, required: true },
    incubacion: { type: Number, required: true },
    fructificacion: { type: Number, required: true },
  },
  { _id: false }
);

const fungusTypeSchema = new Schema<FungusTypeDoc>(
  {
    nombre: { type: String, required: true, unique: true, trim: true },
    nombreCientifico: { type: String },
    notas: { type: String },
    activo: { type: Boolean, default: true },
    diasEsperadosDefault: {
      type: diasEsperadosDefaultSchema,
      required: true,
    },
  },
  { timestamps: true }
);

const FungusType: Model<FungusTypeDoc> =
  (mongoose.models.FungusType as Model<FungusTypeDoc>) ||
  mongoose.model<FungusTypeDoc>("FungusType", fungusTypeSchema, "fungus_types");

export default FungusType;
