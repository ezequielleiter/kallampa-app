import mongoose, { Schema, Document, Model } from "mongoose";

export interface SubstrateTypeDoc extends Document {
  nombre: string;
  notas?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const substrateTypeSchema = new Schema<SubstrateTypeDoc>(
  {
    nombre: { type: String, required: true, unique: true, trim: true },
    notas: { type: String },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const SubstrateType: Model<SubstrateTypeDoc> =
  (mongoose.models.SubstrateType as Model<SubstrateTypeDoc>) ||
  mongoose.model<SubstrateTypeDoc>(
    "SubstrateType",
    substrateTypeSchema,
    "substrate_types"
  );

export default SubstrateType;
