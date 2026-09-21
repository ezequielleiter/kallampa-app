import { clearSession, getSession } from "@/lib/session";

const PUBLIC_ROUTES = ["/login", "/registro"];

// Helper unico de fetch para toda la UI. Todas las rutas de la API
// responden { data: T } (2xx) o { error: string } (4xx/5xx).
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
  const json = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      clearSession();
      if (typeof window !== "undefined" && !PUBLIC_ROUTES.includes(window.location.pathname)) {
        // apiFetch no es un componente: no hay useRouter() disponible acá.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
      }
    }
    throw new Error(json.error || "Error de red");
  }
  return json.data as T;
}
