import mongoose, { Schema, Document, Model, Types } from "mongoose";

export const JAR_ESTADOS = [
  "colonizando",
  "colonizado",
  "contaminado",
  "usado",
] as const;

export type JarEstado = (typeof JAR_ESTADOS)[number];

export interface JarDoc extends Document {
  userId: Types.ObjectId;
  batchId: Types.ObjectId;
  numeroGuia: string;
  estado: JarEstado;
  createdAt: Date;
  updatedAt: Date;
}

const jarSchema = new Schema<JarDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
      index: true,
    },
    numeroGuia: { type: String, required: true },
    estado: {
      type: String,
      enum: JAR_ESTADOS,
      default: "colonizando",
    },
  },
  { timestamps: true }
);

jarSchema.index({ userId: 1, numeroGuia: 1 }, { unique: true });

const Jar: Model<JarDoc> =
  (mongoose.models.Jar as Model<JarDoc>) ||
  mongoose.model<JarDoc>("Jar", jarSchema, "jars");

export default Jar;
