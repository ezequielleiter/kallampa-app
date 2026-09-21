"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import type { JarSearchResult } from "@/lib/types";

export function Header() {
  const router = useRouter();
  const t = useTranslations("header");
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
        toast.error(t("jarWithoutBatch"));
        return;
      }
      setNumeroGuia("");
      router.push(`/lotes/${jar.batch._id}`);
    } catch {
      toast.error(t("jarNotFound"));
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
          placeholder={t("searchPlaceholder")}
          className="h-8"
        />
        <Button type="submit" size="icon" variant="outline" disabled={buscando}>
          <Search />
        </Button>
      </form>
    </header>
  );
}
