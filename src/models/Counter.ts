import mongoose, { Schema, InferSchemaType } from "mongoose";

const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

export type CounterDoc = InferSchemaType<typeof counterSchema>;

const Counter =
  (mongoose.models.Counter as mongoose.Model<CounterDoc>) ||
  mongoose.model<CounterDoc>("Counter", counterSchema);

export default Counter;
