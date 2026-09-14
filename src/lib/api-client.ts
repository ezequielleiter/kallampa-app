// Helper unico de fetch para toda la UI. Todas las rutas de la API
// responden { data: T } (2xx) o { error: string } (4xx/5xx).
export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error de red");
  return json.data as T;
}
