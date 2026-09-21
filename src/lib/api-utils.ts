import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function fail(error: string, status = 500) {
  return NextResponse.json({ error }, { status });
}

/**
 * Punto unico de manejo de errores para los route handlers.
 * Mapea ZodError -> 400, errores "conocidos" lanzados a mano (ApiError) ->
 * su propio status, y cualquier otra cosa -> 500.
 */
export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    const message = err.issues
      .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
      .join("; ");
    return fail(message || "Datos invalidos", 400);
  }

  if (err instanceof ApiError) {
    return fail(err.message, err.status);
  }

  console.error(err);
  return fail("Error interno del servidor", 500);
}

/** Error "de negocio" con status code explicito (404, 409, etc). */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export function notFound(message = "No encontrado") {
  return new ApiError(message, 404);
}

export function conflict(message = "Conflicto de estado") {
  return new ApiError(message, 409);
}

export function badRequest(message = "Solicitud invalida") {
  return new ApiError(message, 400);
}

export function unauthorized(message = "No autorizado") {
  return new ApiError(message, 401);
}

export function forbidden(message = "Acceso denegado") {
  return new ApiError(message, 403);
}
