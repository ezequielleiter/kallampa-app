"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import type { JarSearchResult } from "@/lib/types";

const NAV_LINKS = [
  { href: "/", label: "Tablero" },
  { href: "/frascos", label: "Frascos" },
  { href: "/catalogos", label: "Catálogos" },
  { href: "/estadisticas", label: "Estadísticas" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [numeroGuia, setNumeroGuia] = useState("");
  const [buscando, setBuscando] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const value = numeroGuia.trim();
    if (!value) return;
    setBuscando(true);
    try {
      const jar = await apiFetch<JarSearchResult>(
        `/api/jars/search?numeroGuia=${encodeURIComponent(value)}`
      );
      if (!jar.batch) {
        toast.error("El frasco existe pero no tiene un lote asociado");
        return;
      }
      setNumeroGuia("");
      router.push(`/lotes/${jar.batch._id}`);
    } catch {
      toast.error("No se encontró ningún frasco con ese número de guía");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-base font-semibold whitespace-nowrap">
            🍄 Cultivo
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2 sm:w-72">
          <Input
            value={numeroGuia}
            onChange={(e) => setNumeroGuia(e.target.value)}
            placeholder="Buscar frasco por N° de guía…"
            className="h-8"
          />
          <Button type="submit" size="icon" variant="outline" disabled={buscando}>
            <Search />
          </Button>
        </form>
      </div>
    </header>
  );
}
