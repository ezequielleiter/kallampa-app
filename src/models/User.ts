import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Cuenta de usuario. `passwordHash` y `apiKey` tienen `select:false` para
 * que nunca aparezcan en un find()/lean() genérico — hay que pedirlos
 * explícito con `.select("+passwordHash")`/`.select("+apiKey")` en los
 * lugares que realmente los necesitan (login, requireAuth).
 */

export interface UserDoc extends Document {
  username: string;
  email: string;
  passwordHash: string;
  apiKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true, select: false },
    apiKey: { type: String, required: true, unique: true, select: false },
  },
  { timestamps: true }
);

const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) ||
  mongoose.model<UserDoc>("User", userSchema, "users");

export default User;
