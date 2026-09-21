import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { verifySessionToken } from "@/lib/auth";
import { unauthorized } from "@/lib/api-utils";

/**
 * Exige x-api-key + JWT de sesion validos y que apunten a la MISMA cuenta.
 * Lanza (no devuelve Response) para que el try/catch de cada route handler
 * lo capture via handleApiError, igual que ZodError/ApiError.
 *
 * Se conecta a si mismo (no asume que el caller ya llamo dbConnect()):
 * la mayoria de los route handlers llaman requireAuth() como primera linea,
 * antes de su propio dbConnect(), y con `bufferCommands:false` una query
 * contra una conexion todavia no establecida explota en vez de esperar.
 */
export async function requireAuth(req: NextRequest): Promise<{ userId: string }> {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) throw unauthorized("Falta x-api-key");

  await dbConnect();
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
