import mongoose, { Schema, Document, Model, Types } from "mongoose";

export const JAR_ESTADOS = [
  "colonizando",
  "colonizado",
  "contaminado",
  "usado",
] as const;

export type JarEstado = (typeof JAR_ESTADOS)[number];

export interface JarDoc extends Document {
  batchId: Types.ObjectId;
  numeroGuia: string;
  estado: JarEstado;
  createdAt: Date;
  updatedAt: Date;
}

const jarSchema = new Schema<JarDoc>(
  {
    batchId: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
      index: true,
    },
    numeroGuia: { type: String, required: true, unique: true },
    estado: {
      type: String,
      enum: JAR_ESTADOS,
      default: "colonizando",
    },
  },
  { timestamps: true }
);

const Jar: Model<JarDoc> =
  (mongoose.models.Jar as Model<JarDoc>) ||
  mongoose.model<JarDoc>("Jar", jarSchema, "jars");

export default Jar;
