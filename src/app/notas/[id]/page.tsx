"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
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
import { EmptyState, PageContainer, PageHeader } from "@/components/kallampa/PageHeader";
import { NOTA_PROSE_CLASSNAME } from "@/components/notas/NotaEditor";
import { useBreadcrumbs } from "@/components/shared/Breadcrumbs";
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
  const tNav = useTranslations("nav");
  useBreadcrumbs(
    nota ? [{ label: tNav("notas"), href: "/notas" }, { label: nota.titulo }] : null
  );

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

  if (loading || !nota) {
    return (
      <PageContainer className="max-w-[880px]">
        <EmptyState>{loading ? t("loading") : t("notFound")}</EmptyState>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="max-w-[880px]">
      <PageHeader
        title={nota.titulo}
        subtitle={`${t("lastEdited")}: ${formatFechaCorta(nota.updatedAt)}`}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push(`/notas/${nota._id}/editar`)}>
              <PencilSimpleIcon /> {t("edit")}
            </Button>
            <Button variant="destructive" onClick={() => setBorrarOpen(true)}>
              <TrashIcon /> {t("delete")}
            </Button>
          </>
        }
      />

      <article className="rounded-lg bg-surface-card px-6 py-5 shadow-sm">
        <div className={NOTA_PROSE_CLASSNAME}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{nota.contenido}</ReactMarkdown>
        </div>
      </article>

      <AlertDialog open={borrarOpen} onOpenChange={setBorrarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialogTitle", { titulo: nota.titulo })}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteDialogDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" loading={borrando} onClick={handleBorrar}>
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
