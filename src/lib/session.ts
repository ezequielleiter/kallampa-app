// Manejo de sesión guardada en localStorage. Mismo criterio defensivo
// (try/catch, guard de `window`) que el resto del proyecto usa para
// acceder a browser storage.
export interface Session {
  token: string;
  apiKey: string;
  user: { _id: string; username: string; email: string };
}

const STORAGE_KEY = "session";

export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // localStorage puede fallar en modo privado/incógnito o con site data bloqueada
  }
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ver arriba
  }
}
