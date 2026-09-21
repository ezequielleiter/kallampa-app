import mongoose, { Schema, Document, Model } from "mongoose";

export interface SubstrateTypeDoc extends Document {
  userId: mongoose.Types.ObjectId;
  nombre: string;
  notas?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const substrateTypeSchema = new Schema<SubstrateTypeDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    nombre: { type: String, required: true, trim: true },
    notas: { type: String },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

substrateTypeSchema.index({ userId: 1, nombre: 1 }, { unique: true });

const SubstrateType: Model<SubstrateTypeDoc> =
  (mongoose.models.SubstrateType as Model<SubstrateTypeDoc>) ||
  mongoose.model<SubstrateTypeDoc>(
    "SubstrateType",
    substrateTypeSchema,
    "substrate_types"
  );

export default SubstrateType;
