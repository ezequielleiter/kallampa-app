import { clearSession, getSession } from "@/lib/session";
import { translateErrorCodes, translateErrorMessage } from "@/lib/error-messages";

const PUBLIC_ROUTES = ["/login", "/registro"];

interface ApiErrorBody {
  error?: string;
  code?: string;
  codes?: string[];
}

// Helper unico de fetch para toda la UI. Todas las rutas de la API
// responden { data: T } (2xx) o { error: string, code?, codes? } (4xx/5xx).
// `code`/`codes` son codes estables que se traducen al idioma activo antes
// de lanzar el Error (ver src/lib/error-messages.ts) -- si el idioma activo
// es español, o si falta la traduccion de algun code, se usa `error` tal
// cual (ya viene en español desde el backend).
export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const session = getSession();
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(session
        ? { "x-api-key": session.apiKey, Authorization: `Bearer ${session.token}` }
        : {}),
      ...(init?.headers || {}),
    },
  });
  const json: ApiErrorBody & { data?: unknown } = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      clearSession();
      if (typeof window !== "undefined" && !PUBLIC_ROUTES.includes(window.location.pathname)) {
        // apiFetch no es un componente: no hay useRouter() disponible acá.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
      }
    }
    const fallback = json.error || "Error de red";
    let message = fallback;
    if (json.codes && json.codes.length > 0) {
      message = translateErrorCodes(json.codes) ?? fallback;
    } else if (json.code) {
      message = translateErrorMessage(`${json.code}:${fallback}`) ?? fallback;
    }
    throw new Error(message);
  }
  return json.data as T;
}
