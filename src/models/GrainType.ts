import mongoose, { Schema, Document, Model } from "mongoose";

export interface GrainTypeDoc extends Document {
  userId: mongoose.Types.ObjectId;
  nombre: string;
  notas?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const grainTypeSchema = new Schema<GrainTypeDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    nombre: { type: String, required: true, trim: true },
    notas: { type: String },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

grainTypeSchema.index({ userId: 1, nombre: 1 }, { unique: true });

const GrainType: Model<GrainTypeDoc> =
  (mongoose.models.GrainType as Model<GrainTypeDoc>) ||
  mongoose.model<GrainTypeDoc>("GrainType", grainTypeSchema, "grain_types");

export default GrainType;
