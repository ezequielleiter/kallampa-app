import mongoose, { Schema, Document, Model, Types } from "mongoose";

/**
 * Un Recipiente es donde el grano colonizado de uno o mas Jars se reparte
 * junto con sustrato nuevo. A diferencia del Jar (que solo transita
 * colonizando -> colonizado/contaminado -> usado), el Recipiente tiene su
 * propia linea de tiempo completa: incubacion -> fructificacion -> cosecha
 * (oleadas), y puede contaminarse/descartarse de forma independiente de los
 * demas recipientes del mismo lote.
 */

export const RECIPIENTE_ESTADOS = [
  "incubando",
  "fructificando",
  "finalizado",
  "contaminado",
  "descartado",
] as const;

export type RecipienteEstado = (typeof RECIPIENTE_ESTADOS)[number];

export interface Oleada {
  _id?: Types.ObjectId;
  fecha: Date;
  pesoKg: number;
  notas?: string;
}

export interface RecipienteDoc extends Document {
  batchId: Types.ObjectId;
  numeroSeguimiento: string;
  origenFrascoIds: Types.ObjectId[];
  tipoSustratoId: Types.ObjectId;
  pesoSustratoKg: number;
  precioPorKg: number;
  fechaInicioIncubacion: Date;
  diasEsperadosIncubacion: number;
  fechaInicioFructificacion?: Date;
  diasEsperadosFructificacion?: number;
  estado: RecipienteEstado;
  motivoPerdida?: string;
  oleadas: Types.DocumentArray<Oleada>;
  createdAt: Date;
  updatedAt: Date;
}

const oleadaSchema = new Schema<Oleada>({
  fecha: { type: Date, required: true },
  pesoKg: { type: Number, required: true },
  notas: { type: String },
});

const recipienteSchema = new Schema<RecipienteDoc>(
  {
    batchId: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
      index: true,
    },
    numeroSeguimiento: { type: String, required: true, unique: true },
    // Los frascos de micelio liquido de Clonacion NO originan recipientes
    // directamente -- se usan para iniciar un lote nuevo (ver
    // Batch.origenFrascoLiquidoId). Un recipiente siempre viene de uno o
    // mas Jars (frascos de grano) de ESTE lote.
    origenFrascoIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Jar" }],
      required: true,
      validate: {
        validator: (v: unknown[]) => Array.isArray(v) && v.length >= 1,
        message: "Se requiere al menos un frasco de origen",
      },
      index: true,
    },
    tipoSustratoId: {
      type: Schema.Types.ObjectId,
      ref: "SubstrateType",
      required: true,
    },
    pesoSustratoKg: { type: Number, required: true },
    precioPorKg: { type: Number, required: true },
    fechaInicioIncubacion: { type: Date, required: true },
    diasEsperadosIncubacion: { type: Number, required: true },
    fechaInicioFructificacion: { type: Date },
    diasEsperadosFructificacion: { type: Number },
    estado: {
      type: String,
      enum: RECIPIENTE_ESTADOS,
      default: "incubando",
      index: true,
    },
    motivoPerdida: { type: String },
    oleadas: { type: [oleadaSchema], default: [] },
  },
  { timestamps: true }
);

const Recipiente: Model<RecipienteDoc> =
  (mongoose.models.Recipiente as Model<RecipienteDoc>) ||
  mongoose.model<RecipienteDoc>("Recipiente", recipienteSchema, "recipientes");

export default Recipiente;
