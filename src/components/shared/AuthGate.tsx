"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { Sidebar } from "@/components/shared/Sidebar";
import { BreadcrumbsProvider } from "@/components/shared/Breadcrumbs";
import { getSession } from "@/lib/session";

// "/" es la landing publica; el panel arranca en /lotes.
const PUBLIC_ROUTES = ["/", "/login", "/registro"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [autenticado, setAutenticado] = useState(false);

  const esRutaPublica = pathname ? PUBLIC_ROUTES.includes(pathname) : false;

  useEffect(() => {
    if (esRutaPublica) return;
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    void Promise.resolve().then(() => setAutenticado(true));
  }, [esRutaPublica, pathname, router]);

  if (esRutaPublica) {
    return <>{children}</>;
  }

  if (!autenticado) {
    return null;
  }

  // Sidebar fija de 208px + columna de contenido con topbar pegajosa.
  return (
    <BreadcrumbsProvider>
      <div className="grid min-h-dvh grid-cols-[var(--sidebar-width)_minmax(0,1fr)]">
        <Sidebar />
        <div className="flex min-w-0 flex-col">
          <Header />
          <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        </div>
      </div>
    </BreadcrumbsProvider>
  );
}
