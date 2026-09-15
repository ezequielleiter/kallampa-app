import mongoose, { Schema, Document, Model, Types } from "mongoose";

export const FRASCO_LIQUIDO_ESTADOS = ["valido", "vacio", "finalizado", "contaminado"] as const;

export type FrascoLiquidoEstado = (typeof FRASCO_LIQUIDO_ESTADOS)[number];

export interface FrascoLiquidoDoc extends Document {
  clonacionId: Types.ObjectId;
  origenPlacaId: Types.ObjectId;
  etiqueta: string;
  fechaCreacion: Date;
  estado: FrascoLiquidoEstado;
  createdAt: Date;
  updatedAt: Date;
}

const frascoLiquidoSchema = new Schema<FrascoLiquidoDoc>(
  {
    // Denormalizado desde origenPlacaId.clonacionId para poder filtrar/
    // agrupar sin un join extra (mismo criterio que otros denormalizados
    // del proyecto, ej. Recipiente.batchId via Jar).
    clonacionId: {
      type: Schema.Types.ObjectId,
      ref: "Clonacion",
      required: true,
      index: true,
    },
    origenPlacaId: {
      type: Schema.Types.ObjectId,
      ref: "Placa",
      required: true,
    },
    etiqueta: { type: String, required: true, unique: true },
    fechaCreacion: { type: Date, required: true },
    estado: {
      type: String,
      enum: FRASCO_LIQUIDO_ESTADOS,
      default: "valido",
    },
  },
  { timestamps: true }
);

const FrascoLiquido: Model<FrascoLiquidoDoc> =
  (mongoose.models.FrascoLiquido as Model<FrascoLiquidoDoc>) ||
  mongoose.model<FrascoLiquidoDoc>("FrascoLiquido", frascoLiquidoSchema, "frascos_liquidos");

export default FrascoLiquido;
