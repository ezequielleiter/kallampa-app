"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
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
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        <Button size="sm" onClick={() => router.push("/notas/nueva")}>
          <Plus /> {t("newNota")}
        </Button>
      </div>

      {!loading && notas.length > 0 && (
        <Input
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : notas.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : notasFiltradas.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noSearchResults")}</p>
      ) : (
        <Table>
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
                <TableCell className="max-w-sm truncate text-muted-foreground">
                  {nota.extracto}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatFechaCorta(nota.updatedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
