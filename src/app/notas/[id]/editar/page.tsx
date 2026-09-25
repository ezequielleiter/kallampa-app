"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { EmptyState, PageContainer, PageHeader } from "@/components/kallampa/PageHeader";
import { NotaFormCard } from "@/components/notas/NotaFormCard";
import { useBreadcrumbs } from "@/components/shared/Breadcrumbs";
import { apiFetch } from "@/lib/api-client";
import type { Nota } from "@/lib/types";

export default function EditarNotaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations("pages.notasEditar");
  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [tituloOriginal, setTituloOriginal] = useState("");
  const tNav = useTranslations("nav");
  useBreadcrumbs([
    { label: tNav("notas"), href: "/notas" },
    ...(tituloOriginal ? [{ label: tituloOriginal, href: `/notas/${params.id}` }] : []),
    { label: t("title") },
  ]);

  const cargar = useCallback(async () => {
    try {
      const nota = await apiFetch<Nota>(`/api/notas/${params.id}`);
      setTitulo(nota.titulo);
      setTituloOriginal(nota.titulo);
      setContenido(nota.contenido);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [params.id, t]);

  useEffect(() => {
    void Promise.resolve().then(() => cargar());
  }, [cargar]);

  async function handleGuardar() {
    if (!titulo.trim()) {
      setError(t("tituloRequerido"));
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      await apiFetch<Nota>(`/api/notas/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ titulo, contenido }),
      });
      toast.success(t("updatedSuccess"));
      router.push(`/notas/${params.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saveError"));
    } finally {
      setGuardando(false);
    }
  }

  if (loading) {
    return (
      <PageContainer className="max-w-[880px]">
        <EmptyState>{t("loading")}</EmptyState>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="max-w-[880px]">
      <PageHeader title={t("title")} />
      <NotaFormCard
        labels={{
          titulo: t("tituloLabel"),
          contenido: t("contenidoLabel"),
          cancel: t("cancel"),
          submit: t("submit"),
        }}
        titulo={titulo}
        onTituloChange={setTitulo}
        contenido={contenido}
        onContenidoChange={setContenido}
        error={error}
        guardando={guardando}
        onCancel={() => router.push(`/notas/${params.id}`)}
        onSubmit={handleGuardar}
      />
    </PageContainer>
  );
}
