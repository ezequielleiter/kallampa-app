"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import type { JarSearchResult } from "@/lib/types";

export function Header() {
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
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-end border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
      <form onSubmit={handleSearch} className="flex w-72 items-center gap-2">
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
    </header>
  );
}
