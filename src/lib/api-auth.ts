import type { NextRequest } from "next/server";
import User from "@/models/User";
import { verifySessionToken } from "@/lib/auth";
import { unauthorized } from "@/lib/api-utils";

/**
 * Exige x-api-key + JWT de sesion validos y que apunten a la MISMA cuenta.
 * Lanza (no devuelve Response) para que el try/catch de cada route handler
 * lo capture via handleApiError, igual que ZodError/ApiError.
 */
export async function requireAuth(req: NextRequest): Promise<{ userId: string }> {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) throw unauthorized("Falta x-api-key");

  const user = await User.findOne({ apiKey }).select("+apiKey");
  if (!user) throw unauthorized("api-key invalida");

  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw unauthorized("Falta token de sesion");

  const token = authHeader.slice("Bearer ".length).trim();
  const payload = verifySessionToken(token);
  if (!payload) throw unauthorized("Sesion invalida o vencida");

  if (payload.sub !== String(user._id)) throw unauthorized("api-key y sesion no coinciden");

  return { userId: String(user._id) };
}
