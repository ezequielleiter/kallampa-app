"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

/**
 * Si se pueden crear cuentas nuevas (ver src/lib/registro.ts). `null`
 * mientras se consulta; ante un error se asume abierto y decide la API.
 */
export function useRegistroHabilitado(): boolean | null {
  const [habilitado, setHabilitado] = useState<boolean | null>(null);
  useEffect(() => {
    let vivo = true;
    apiFetch<{ habilitado: boolean }>("/api/auth/register")
      .then((d) => vivo && setHabilitado(d.habilitado))
      .catch(() => vivo && setHabilitado(true));
    return () => {
      vivo = false;
    };
  }, []);
  return habilitado;
}
