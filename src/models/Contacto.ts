import mongoose, { Schema, Document, Model } from "mongoose";

// Consulta enviada desde el formulario publico de la landing ("Instalamos el
// control de clima en tu invernadero"). No pertenece a ninguna cuenta.
export interface ContactoDoc extends Document {
  nombre: string;
  email: string;
  telefono?: string;
  invernaderos?: number;
  superficie?: string;
  mensaje?: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactoSchema = new Schema<ContactoDoc>(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    telefono: { type: String, trim: true },
    invernaderos: { type: Number },
    superficie: { type: String, trim: true },
    mensaje: { type: String, trim: true },
  },
  { timestamps: true }
);

contactoSchema.index({ createdAt: -1 });

const Contacto: Model<ContactoDoc> =
  (mongoose.models.Contacto as Model<ContactoDoc>) ||
  mongoose.model<ContactoDoc>("Contacto", contactoSchema, "contactos");

export default Contacto;
