"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { formatFechaCorta } from "@/lib/format";
import type { Nota } from "@/lib/types";

export default function NotaDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations("pages.notasDetalle");
  const [nota, setNota] = useState<Nota | null>(null);
  const [loading, setLoading] = useState(true);
  const [borrarOpen, setBorrarOpen] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const data = await apiFetch<Nota>(`/api/notas/${params.id}`);
      setNota(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [params.id, t]);

  useEffect(() => {
    void Promise.resolve().then(() => cargar());
  }, [cargar]);

  async function handleBorrar() {
    setBorrando(true);
    try {
      await apiFetch(`/api/notas/${params.id}`, { method: "DELETE" });
      toast.success(t("deletedSuccess"));
      router.push("/notas");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("deleteError"));
      setBorrando(false);
    }
  }

  if (loading) {
    return <p className="p-4 text-sm text-muted-foreground">{t("loading")}</p>;
  }

  if (!nota) {
    return <p className="p-4 text-sm text-muted-foreground">{t("notFound")}</p>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push("/notas")}>
          {t("backToNotas")}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/notas/${nota._id}/editar`)}
          >
            <Pencil /> {t("edit")}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setBorrarOpen(true)}>
            <Trash2 /> {t("delete")}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="text-xl font-semibold">{nota.titulo}</h1>
            <span className="text-xs text-muted-foreground">
              {t("lastEdited")}: {formatFechaCorta(nota.updatedAt)}
            </span>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{nota.contenido}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={borrarOpen} onOpenChange={setBorrarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialogTitle", { titulo: nota.titulo })}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteDialogDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={borrando} onClick={handleBorrar}>
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
