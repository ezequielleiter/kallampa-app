import mongoose, { Schema, Document, Model, Types } from "mongoose";

export const MOTIVOS_MERMA = ["vencido", "regalado", "consumo_propio", "otro"] as const;
export type MotivoMerma = (typeof MOTIVOS_MERMA)[number];

// Producto cosechado que salio del stock de un lote sin venderse.
export interface MermaDoc extends Document {
  userId: Types.ObjectId;
  batchId: Types.ObjectId;
  fecha: Date;
  kg: number;
  motivo: MotivoMerma;
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

const mermaSchema = new Schema<MermaDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    fecha: { type: Date, required: true },
    kg: {
      type: Number,
      required: true,
      validate: { validator: (v: number) => v > 0, message: "Los kg deben ser mayores a 0" },
    },
    motivo: { type: String, enum: MOTIVOS_MERMA, required: true },
    notas: { type: String },
  },
  { timestamps: true }
);

mermaSchema.index({ userId: 1, batchId: 1 });

const Merma: Model<MermaDoc> =
  (mongoose.models.Merma as Model<MermaDoc>) ||
  mongoose.model<MermaDoc>("Merma", mermaSchema, "mermas");

export default Merma;
