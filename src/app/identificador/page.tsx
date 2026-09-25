"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";
import { JAR_ESTADO_BADGE_VARIANT } from "@/lib/constants";
import type { JarSearchResult } from "@/lib/types";

export default function FrascosPage() {
  const t = useTranslations("pages.frascos");
  const tEstado = useTranslations("estados.jar");
  const [numeroGuia, setNumeroGuia] = useState("");
  const [resultado, setResultado] = useState<JarSearchResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const value = numeroGuia.trim();
    if (!value) return;
    setLoading(true);
    setNotFound(false);
    setResultado(null);
    try {
      const jar = await apiFetch<JarSearchResult>(
        `/api/jars/search?numeroGuia=${encodeURIComponent(value)}`
      );
      setResultado(jar);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">{t("title")}</h1>
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <Input
          autoFocus
          value={numeroGuia}
          onChange={(e) => setNumeroGuia(e.target.value)}
          placeholder={t("searchPlaceholder")}
        />
        <Button type="submit" disabled={loading}>
          <Search /> {t("searchButton")}
        </Button>
      </form>

      {notFound && <p className="text-sm text-destructive">{t("notFound")}</p>}

      {resultado && (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium">{resultado.numeroGuia}</span>
              <Badge variant={JAR_ESTADO_BADGE_VARIANT[resultado.estado]}>
                {tEstado(resultado.estado)}
              </Badge>
            </div>
            {resultado.batch && (
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <span>{t("lote")}: {resultado.batch.numeroLote}</span>
                <span>{t("hongo")}: {resultado.batch.fungusTypeId?.nombre}</span>
              </div>
            )}
            {resultado.batch && (
              <Button
                size="sm"
                className="w-fit"
                render={<Link href={`/lotes/${resultado.batch._id}`} />}
              >
                {t("verLote")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
