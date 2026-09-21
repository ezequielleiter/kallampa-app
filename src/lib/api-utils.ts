import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

/**
 * Los strings de mensaje de error (acá y en los `.min()/.refine()` de Zod,
 * y en los mensajes pasados a notFound/conflict/badRequest/etc) siguen la
 * convención "<code_snake_case>:<mensaje en español>", ej.
 * "titulo_requerido:El título es requerido". El `code` es estable y se usa
 * del lado del cliente para traducir a otros idiomas (ver
 * src/lib/error-messages.ts); el texto en español sigue siendo el `error`
 * que recibe el cliente cuando no hay traducción o el idioma activo es
 * español — nunca cambia la respuesta para quien no traduce nada.
 */
// Un code valido es un identificador snake_case corto -- cualquier otra
// cosa antes del primer ":" (ej. un mensaje que ya trae dos puntos en su
// propio texto, como "...(estado actual: 'colonizando')") NO se interpreta
// como code, se deja el string entero como mensaje.
const CODE_PATTERN = /^[a-z][a-z0-9_]*$/;

export function splitErrorCode(raw: string): { code?: string; message: string } {
  const idx = raw.indexOf(":");
  if (idx === -1) return { message: raw };
  const code = raw.slice(0, idx);
  if (!CODE_PATTERN.test(code)) return { message: raw };
  return { code, message: raw.slice(idx + 1) };
}

export function fail(rawMessage: string, status = 500, codes?: string[]) {
  const { code, message } = splitErrorCode(rawMessage);
  return NextResponse.json(
    {
      error: message,
      ...(code ? { code } : {}),
      ...(codes && codes.length > 0 ? { codes } : {}),
    },
    { status }
  );
}

/**
 * Punto unico de manejo de errores para los route handlers.
 * Mapea ZodError -> 400, errores "conocidos" lanzados a mano (ApiError) ->
 * su propio status, y cualquier otra cosa -> 500.
 */
export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    const codes: string[] = [];
    const message = err.issues
      .map((i) => {
        const split = splitErrorCode(i.message);
        if (split.code) codes.push(split.code);
        return `${i.path.join(".") || "root"}: ${split.message}`;
      })
      .join("; ");
    return fail(message || "datos_invalidos:Datos invalidos", 400, codes);
  }

  if (err instanceof ApiError) {
    return fail(err.message, err.status);
  }

  console.error(err);
  return fail("error_interno:Error interno del servidor", 500);
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

export function notFound(message = "no_encontrado:No encontrado") {
  return new ApiError(message, 404);
}

export function conflict(message = "conflicto_estado:Conflicto de estado") {
  return new ApiError(message, 409);
}

export function badRequest(message = "solicitud_invalida:Solicitud invalida") {
  return new ApiError(message, 400);
}

export function unauthorized(message = "no_autorizado:No autorizado") {
  return new ApiError(message, 401);
}

export function forbidden(message = "acceso_denegado:Acceso denegado") {
  return new ApiError(message, 403);
}
