import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Nota: wiki simple del usuario, sin relacion con el dominio de cultivo.
 * `contenido` guarda el Markdown crudo tal como lo serializa el editor
 * (tiptap-markdown) del lado del cliente.
 */

export interface NotaDoc extends Document {
  userId: mongoose.Types.ObjectId;
  titulo: string;
  contenido: string;
  createdAt: Date;
  updatedAt: Date;
}

const notaSchema = new Schema<NotaDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    titulo: { type: String, required: true, trim: true },
    // Sin `required`: una nota recien empezada puede no tener contenido
    // todavia (Mongoose trata el string vacio como "ausente" para
    // `required`, lo que rechazaria una nota valida sin cuerpo).
    contenido: { type: String, default: "" },
  },
  { timestamps: true }
);

const Nota: Model<NotaDoc> =
  (mongoose.models.Nota as Model<NotaDoc>) ||
  mongoose.model<NotaDoc>("Nota", notaSchema, "notas");

export default Nota;
