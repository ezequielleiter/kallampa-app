import mongoose, { Schema, Document, Model, Types } from "mongoose";

// A diferencia de JAR_ESTADOS, no hay 'usado': una placa colonizada no se
// consume al usarla como origen de un frasco liquido, se puede reusar
// tantas veces como se quiera mientras no se contamine.
export const PLACA_ESTADOS = ["colonizando", "colonizado", "contaminado"] as const;

export type PlacaEstado = (typeof PLACA_ESTADOS)[number];

export interface PlacaDoc extends Document {
  userId: Types.ObjectId;
  clonacionId: Types.ObjectId;
  numeroPlaca: string;
  estado: PlacaEstado;
  createdAt: Date;
  updatedAt: Date;
}

const placaSchema = new Schema<PlacaDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clonacionId: {
      type: Schema.Types.ObjectId,
      ref: "Clonacion",
      required: true,
      index: true,
    },
    numeroPlaca: { type: String, required: true },
    estado: {
      type: String,
      enum: PLACA_ESTADOS,
      default: "colonizando",
    },
  },
  { timestamps: true }
);

placaSchema.index({ userId: 1, numeroPlaca: 1 }, { unique: true });

const Placa: Model<PlacaDoc> =
  (mongoose.models.Placa as Model<PlacaDoc>) ||
  mongoose.model<PlacaDoc>("Placa", placaSchema, "placas");

export default Placa;
