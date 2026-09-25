import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 10;
const SESSION_TTL = "24h";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Falta la variable de entorno JWT_SECRET (definila en .env.local o en las variables de entorno del deploy)");
  }
  return secret;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateApiKey(): string {
  return randomBytes(32).toString("hex");
}

export function signSessionToken(userId: string): string {
  return jwt.sign({ sub: userId }, getJwtSecret(), { expiresIn: SESSION_TTL });
}

export function verifySessionToken(token: string): { sub: string } | null {
  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (typeof payload === "object" && payload !== null && typeof payload.sub === "string") {
      return { sub: payload.sub };
    }
    return null;
  } catch {
    return null;
  }
}
