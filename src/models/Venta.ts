import mongoose, { Schema, Document, Model, Types } from "mongoose";

export const MEDIOS_PAGO = ["efectivo", "transferencia", "mercadopago", "otro"] as const;
export type MedioPago = (typeof MEDIOS_PAGO)[number];

// Cada item descuenta kg del stock de UN lote (cosechado - vendido - merma).
// Una venta puede repartir sus kg entre varios lotes, sin repetir lote.
export interface VentaItemDoc {
  batchId: Types.ObjectId;
  kg: number;
  precioPorKg: number;
}

// El total NO se guarda: es Σ kg × precioPorKg (ver src/lib/ventas.ts).
export interface VentaDoc extends Document {
  userId: Types.ObjectId;
  numeroVenta: string;
  fecha: Date;
  clienteId?: Types.ObjectId;
  items: VentaItemDoc[];
  medioPago: MedioPago;
  cobrada: boolean;
  fechaCobro?: Date;
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ventaItemSchema = new Schema<VentaItemDoc>(
  {
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    kg: {
      type: Number,
      required: true,
      validate: { validator: (v: number) => v > 0, message: "Los kg deben ser mayores a 0" },
    },
    precioPorKg: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ventaSchema = new Schema<VentaDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    numeroVenta: { type: String, required: true },
    fecha: { type: Date, required: true },
    clienteId: { type: Schema.Types.ObjectId, ref: "Cliente" },
    items: {
      type: [ventaItemSchema],
      required: true,
      validate: [
        {
          validator: (v: unknown[]) => Array.isArray(v) && v.length >= 1,
          message: "La venta necesita al menos un lote",
        },
        {
          validator: (v: VentaItemDoc[]) =>
            new Set(v.map((i) => String(i.batchId))).size === v.length,
          message: "No se puede repetir un lote en la misma venta",
        },
      ],
    },
    medioPago: { type: String, enum: MEDIOS_PAGO, default: "efectivo" },
    cobrada: { type: Boolean, default: false },
    fechaCobro: { type: Date },
    notas: { type: String },
  },
  { timestamps: true }
);

ventaSchema.index({ userId: 1, numeroVenta: 1 }, { unique: true });
ventaSchema.index({ userId: 1, "items.batchId": 1 });
ventaSchema.index({ userId: 1, clienteId: 1 });

const Venta: Model<VentaDoc> =
  (mongoose.models.Venta as Model<VentaDoc>) ||
  mongoose.model<VentaDoc>("Venta", ventaSchema, "ventas");

export default Venta;
