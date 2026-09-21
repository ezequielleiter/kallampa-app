import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Tarea: evento manual del Calendario, creado por el usuario (a diferencia
 * de los "pills" de lote/clonacion, que se calculan on-the-fly y nunca se
 * persisten -- ver `lotePillsPendientes` en src/lib/metrics.ts).
 */

export const TAREA_ESTADOS = ["pendiente", "hecha"] as const;
export type TareaEstado = (typeof TAREA_ESTADOS)[number];

export interface TareaDoc extends Document {
  userId: mongoose.Types.ObjectId;
  titulo: string;
  descripcion?: string;
  fecha: Date;
  estado: TareaEstado;
  createdAt: Date;
  updatedAt: Date;
}

const tareaSchema = new Schema<TareaDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    titulo: { type: String, required: true, trim: true },
    // Sin `required`: igual que Nota.contenido, un string vacio se trata
    // como "ausente" para `required` y rechazaria una tarea valida sin
    // descripcion.
    descripcion: { type: String, default: "" },
    fecha: { type: Date, required: true, index: true },
    estado: {
      type: String,
      enum: TAREA_ESTADOS,
      default: "pendiente",
    },
  },
  { timestamps: true }
);

const Tarea: Model<TareaDoc> =
  (mongoose.models.Tarea as Model<TareaDoc>) ||
  mongoose.model<TareaDoc>("Tarea", tareaSchema, "tareas");

export default Tarea;
