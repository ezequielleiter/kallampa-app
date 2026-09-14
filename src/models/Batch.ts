import mongoose, { Schema, Document, Model, Types } from "mongoose";

export const BATCH_ESTADOS = [
  "inoculacion_grano",
  "crecimiento_sustrato",
  "fructificacion",
  "cosecha",
  "finalizado",
  "descartado",
] as const;

export type BatchEstado = (typeof BATCH_ESTADOS)[number];

export interface InoculacionGrano {
  tipoGranoId: Types.ObjectId;
  pesoGranoKg: number;
  precioPorKg: number;
  cantidadFrascos: number;
  fechaInicio: Date;
  fechaFin?: Date;
  diasEsperados: number;
}

export interface CrecimientoSustrato {
  tipoSustratoId?: Types.ObjectId;
  kilosSustrato?: number;
  precioPorKg?: number;
  fechaInicio?: Date;
  fechaFin?: Date;
  diasEsperados?: number;
}

export interface Recipiente {
  _id?: Types.ObjectId;
  codigo: string;
  pesoKg: number;
  notas?: string;
}

export interface Fructificacion {
  fechaInicio?: Date;
  fechaFin?: Date;
  diasEsperados?: number;
  recipientes: Types.DocumentArray<Recipiente>;
}

export interface Cosecha {
  fechaInicio?: Date;
  fechaFin?: Date;
  diasEsperados?: number;
}

export interface Oleada {
  _id?: Types.ObjectId;
  numero: number;
  fecha: Date;
  pesoKg: number;
  notas?: string;
}

export interface HistorialEstado {
  _id?: Types.ObjectId;
  estado: string;
  fecha: Date;
}

export interface BatchDoc extends Document {
  numeroLote: string;
  fungusTypeId: Types.ObjectId;
  estado: BatchEstado;
  descartado: boolean;
  motivoDescarte?: string;
  inoculacionGrano: InoculacionGrano;
  crecimientoSustrato?: CrecimientoSustrato;
  fructificacion?: Fructificacion;
  cosecha?: Cosecha;
  oleadas: Types.DocumentArray<Oleada>;
  historialEstados: Types.DocumentArray<HistorialEstado>;
  createdAt: Date;
  updatedAt: Date;
}

const inoculacionGranoSchema = new Schema<InoculacionGrano>(
  {
    tipoGranoId: { type: Schema.Types.ObjectId, ref: "GrainType", required: true },
    pesoGranoKg: { type: Number, required: true },
    precioPorKg: { type: Number, required: true },
    cantidadFrascos: { type: Number, required: true },
    fechaInicio: { type: Date, required: true },
    fechaFin: { type: Date },
    diasEsperados: { type: Number, required: true },
  },
  { _id: false }
);

const crecimientoSustratoSchema = new Schema<CrecimientoSustrato>(
  {
    tipoSustratoId: { type: Schema.Types.ObjectId, ref: "SubstrateType" },
    kilosSustrato: { type: Number },
    precioPorKg: { type: Number },
    fechaInicio: { type: Date },
    fechaFin: { type: Date },
    diasEsperados: { type: Number },
  },
  { _id: false }
);

const recipienteSchema = new Schema<Recipiente>({
  codigo: { type: String, required: true },
  pesoKg: { type: Number, required: true },
  notas: { type: String },
});

const fructificacionSchema = new Schema<Fructificacion>(
  {
    fechaInicio: { type: Date },
    fechaFin: { type: Date },
    diasEsperados: { type: Number },
    recipientes: { type: [recipienteSchema], default: [] },
  },
  { _id: false }
);

const cosechaSchema = new Schema<Cosecha>(
  {
    fechaInicio: { type: Date },
    fechaFin: { type: Date },
    diasEsperados: { type: Number },
  },
  { _id: false }
);

const oleadaSchema = new Schema<Oleada>({
  numero: { type: Number, required: true },
  fecha: { type: Date, required: true },
  pesoKg: { type: Number, required: true },
  notas: { type: String },
});

const historialEstadoSchema = new Schema<HistorialEstado>({
  estado: { type: String, required: true },
  fecha: { type: Date, required: true },
});

const batchSchema = new Schema<BatchDoc>(
  {
    numeroLote: { type: String, required: true, unique: true },
    fungusTypeId: {
      type: Schema.Types.ObjectId,
      ref: "FungusType",
      required: true,
      index: true,
    },
    estado: {
      type: String,
      enum: BATCH_ESTADOS,
      required: true,
      default: "inoculacion_grano",
      index: true,
    },
    descartado: { type: Boolean, default: false },
    motivoDescarte: { type: String },
    inoculacionGrano: { type: inoculacionGranoSchema, required: true },
    crecimientoSustrato: { type: crecimientoSustratoSchema },
    fructificacion: { type: fructificacionSchema },
    cosecha: { type: cosechaSchema },
    oleadas: { type: [oleadaSchema], default: [] },
    historialEstados: { type: [historialEstadoSchema], default: [] },
  },
  { timestamps: true }
);

const Batch: Model<BatchDoc> =
  (mongoose.models.Batch as Model<BatchDoc>) ||
  mongoose.model<BatchDoc>("Batch", batchSchema, "batches");

export default Batch;
