"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, PageContainer, PageHeader } from "@/components/kallampa/PageHeader";
import { apiFetch } from "@/lib/api-client";
import { formatFechaCorta } from "@/lib/format";
import type { NotaListItem } from "@/lib/types";

export default function NotasPage() {
  const router = useRouter();
  const t = useTranslations("pages.notas");
  const [notas, setNotas] = useState<NotaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<NotaListItem[]>("/api/notas");
      setNotas(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void Promise.resolve().then(() => cargar());
  }, [cargar]);

  const notasFiltradas = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notas;
    return notas.filter((n) => n.titulo.toLowerCase().includes(q));
  }, [notas, query]);

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        subtitle={loading ? undefined : t("subtitle", { count: notas.length })}
        actions={
          <>
            {notas.length > 0 && (
              <div className="relative w-56">
                <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-text-subtle" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  aria-label={t("searchPlaceholder")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-[30px]"
                />
              </div>
            )}
            <Button onClick={() => router.push("/notas/nueva")}>
              <PlusIcon /> {t("newNota")}
            </Button>
          </>
        }
      />

      <div className="rounded-lg bg-surface-card px-4 pt-1.5 pb-2.5 shadow-sm">
        {loading ? (
          <EmptyState>{t("loading")}</EmptyState>
        ) : notas.length === 0 ? (
          <EmptyState>{t("empty")}</EmptyState>
        ) : notasFiltradas.length === 0 ? (
          <EmptyState>{t("noSearchResults")}</EmptyState>
        ) : (
          <Table minWidth={560}>
            <TableHeader>
              <TableRow>
                <TableHead>{t("colTitulo")}</TableHead>
                <TableHead>{t("colExtracto")}</TableHead>
                <TableHead className="text-right">{t("colUltimaEdicion")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notasFiltradas.map((nota) => (
                <TableRow
                  key={nota._id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/notas/${nota._id}`)}
                >
                  <TableCell className="font-medium">{nota.titulo}</TableCell>
                  <TableCell className="max-w-sm truncate text-text-subtle">
                    {nota.extracto}
                  </TableCell>
                  <TableCell className="text-right text-text-muted">
                    {formatFechaCorta(nota.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </PageContainer>
  );
}
