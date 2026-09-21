import mongoose, { Schema, Document, Model, Types } from "mongoose";

export const FRASCO_LIQUIDO_ESTADOS = ["valido", "vacio", "finalizado", "contaminado"] as const;

export type FrascoLiquidoEstado = (typeof FRASCO_LIQUIDO_ESTADOS)[number];

export interface FrascoLiquidoDoc extends Document {
  userId: Types.ObjectId;
  clonacionId: Types.ObjectId;
  // Solo presente para frascos nacidos de una Clonacion "placa". Los
  // frascos de "comprado"/"frascoGrano" no vienen de ninguna Placa, asi
  // que queda undefined.
  origenPlacaId?: Types.ObjectId;
  numeroGuia: string;
  fechaCreacion: Date;
  estado: FrascoLiquidoEstado;
  createdAt: Date;
  updatedAt: Date;
}

const frascoLiquidoSchema = new Schema<FrascoLiquidoDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
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
      required: false,
    },
    numeroGuia: { type: String, required: true },
    fechaCreacion: { type: Date, required: true },
    estado: {
      type: String,
      enum: FRASCO_LIQUIDO_ESTADOS,
      default: "valido",
    },
  },
  { timestamps: true }
);

frascoLiquidoSchema.index({ userId: 1, numeroGuia: 1 }, { unique: true });

const FrascoLiquido: Model<FrascoLiquidoDoc> =
  (mongoose.models.FrascoLiquido as Model<FrascoLiquidoDoc>) ||
  mongoose.model<FrascoLiquidoDoc>("FrascoLiquido", frascoLiquidoSchema, "frascos_liquidos");

export default FrascoLiquido;
