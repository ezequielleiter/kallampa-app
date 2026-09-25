"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRightIcon, BarcodeIcon, MagnifyingGlassIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader } from "@/components/kallampa/PageHeader";
import { StatusTag } from "@/components/kallampa/StatusTag";
import { apiFetch } from "@/lib/api-client";
import type { JarSearchResult } from "@/lib/types";

export default function FrascosPage() {
  const t = useTranslations("pages.frascos");
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

  const fungus = resultado?.batch?.fungusTypeId;

  return (
    <PageContainer className="max-w-[640px]">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1">
          <BarcodeIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-text-subtle" />
          <Input
            autoFocus
            value={numeroGuia}
            onChange={(e) => setNumeroGuia(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="pl-8 tabular-nums"
          />
        </div>
        <Button type="submit" loading={loading}>
          {!loading && <MagnifyingGlassIcon />} {t("searchButton")}
        </Button>
      </form>

      {notFound && (
        <div
          role="alert"
          className="flex items-center gap-2 text-[13px] text-danger-text"
        >
          <WarningCircleIcon className="size-4 shrink-0" />
          {t("notFound")}
        </div>
      )}

      {resultado && (
        <div className="flex flex-col gap-3.5 rounded-lg bg-surface-card px-5 py-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-base font-medium tabular-nums">{resultado.numeroGuia}</span>
            <StatusTag kind="jar" estado={resultado.estado} />
          </div>
          {resultado.batch && (
            <dl className="grid grid-cols-2 gap-3 rounded-md bg-surface-inset px-3.5 py-3">
              <div>
                <dt className="text-xs text-text-subtle">{t("lote")}</dt>
                <dd className="mt-0.5 text-[13.5px] tabular-nums">{resultado.batch.numeroLote}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-subtle">{t("hongo")}</dt>
                <dd className="mt-0.5 text-[13.5px]">
                  {fungus?.nombre}
                  {fungus?.nombreCientifico && (
                    <span className="block text-[11.5px] text-text-subtle italic">
                      {fungus.nombreCientifico}
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          )}
          {resultado.batch && (
            <Button
              size="sm"
              className="w-fit"
              render={<Link href={`/lotes/${resultado.batch._id}`} />}
            >
              {t("verLote")} <ArrowRightIcon />
            </Button>
          )}
        </div>
      )}
    </PageContainer>
  );
}
