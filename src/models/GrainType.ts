import mongoose, { Schema, Document, Model } from "mongoose";

export interface GrainTypeDoc extends Document {
  nombre: string;
  notas?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const grainTypeSchema = new Schema<GrainTypeDoc>(
  {
    nombre: { type: String, required: true, unique: true, trim: true },
    notas: { type: String },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const GrainType: Model<GrainTypeDoc> =
  (mongoose.models.GrainType as Model<GrainTypeDoc>) ||
  mongoose.model<GrainTypeDoc>("GrainType", grainTypeSchema, "grain_types");

export default GrainType;
