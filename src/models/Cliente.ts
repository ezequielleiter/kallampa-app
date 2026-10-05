import mongoose, { Schema, Document, Model } from "mongoose";

// Cliente de la cuenta (catalogo simple). En una venta es opcional
// ("consumidor final"). No hay DELETE: se desactiva con `activo: false`.
export interface ClienteDoc extends Document {
  userId: mongoose.Types.ObjectId;
  nombre: string;
  contacto?: string;
  notas?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const clienteSchema = new Schema<ClienteDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    nombre: { type: String, required: true, trim: true },
    contacto: { type: String },
    notas: { type: String },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

clienteSchema.index({ userId: 1, nombre: 1 }, { unique: true });

const Cliente: Model<ClienteDoc> =
  (mongoose.models.Cliente as Model<ClienteDoc>) ||
  mongoose.model<ClienteDoc>("Cliente", clienteSchema, "clientes");

export default Cliente;
