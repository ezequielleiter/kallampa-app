"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface Crumb {
  label: string;
  href?: string;
}

const BreadcrumbsContext = createContext<{
  crumbs: Crumb[] | null;
  setCrumbs: (c: Crumb[] | null) => void;
}>({ crumbs: null, setCrumbs: () => {} });

export function BreadcrumbsProvider({ children }: { children: React.ReactNode }) {
  const [crumbs, setCrumbs] = useState<Crumb[] | null>(null);
  return (
    <BreadcrumbsContext.Provider value={{ crumbs, setCrumbs }}>
      {children}
    </BreadcrumbsContext.Provider>
  );
}

export function useBreadcrumbsState() {
  return useContext(BreadcrumbsContext).crumbs;
}

/**
 * Declara la ruta de la pagina en la topbar (p. ej. Produccion › Lotes ›
 * L-2026-001). Si una pagina no la declara, la topbar muestra solo la
 * seccion de la sidebar.
 */
export function useBreadcrumbs(crumbs: Crumb[] | null) {
  const { setCrumbs } = useContext(BreadcrumbsContext);
  const key = crumbs ? JSON.stringify(crumbs) : "";
  useEffect(() => {
    setCrumbs(key ? (JSON.parse(key) as Crumb[]) : null);
    return () => setCrumbs(null);
  }, [key, setCrumbs]);
}
