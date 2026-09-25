import mongoose, { Schema, Document, Model, Types } from "mongoose";

// Dispositivo de monitoreo (microcontrolador) asociado al invernadero. La
// app NO se comunica con el: solo guarda su dominio en la red local para
// abrir su propia pagina web (funciona solo desde la misma red wifi).
export interface Dispositivo {
  _id: Types.ObjectId;
  nombre: string;
  dominio: string;
  createdAt: Date;
  updatedAt: Date;
}

// Invernadero (carpa/sala) de la cuenta. Por ahora solo nombre + medidas en
// metros; la superficie y el volumen se calculan en el cliente. Mas adelante
// se va a usar como zona de incubacion de los recipientes (ver TODO.md).
export interface InvernaderoDoc extends Document {
  userId: mongoose.Types.ObjectId;
  nombre: string;
  altoM: number;
  largoM: number;
  profundidadM: number;
  notas?: string;
  activo: boolean;
  dispositivos: Types.DocumentArray<Dispositivo>;
  createdAt: Date;
  updatedAt: Date;
}

const medida = {
  type: Number,
  required: true,
  validate: { validator: (v: number) => v > 0, message: "La medida debe ser mayor a 0" },
};

const dispositivoSchema = new Schema<Dispositivo>(
  {
    nombre: { type: String, required: true, trim: true },
    dominio: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const invernaderoSchema = new Schema<InvernaderoDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    nombre: { type: String, required: true, trim: true },
    altoM: medida,
    largoM: medida,
    profundidadM: medida,
    notas: { type: String },
    activo: { type: Boolean, default: true },
    dispositivos: { type: [dispositivoSchema], default: [] },
  },
  { timestamps: true }
);

invernaderoSchema.index({ userId: 1, nombre: 1 }, { unique: true });

const Invernadero: Model<InvernaderoDoc> =
  (mongoose.models.Invernadero as Model<InvernaderoDoc>) ||
  mongoose.model<InvernaderoDoc>("Invernadero", invernaderoSchema, "invernaderos");

export default Invernadero;
