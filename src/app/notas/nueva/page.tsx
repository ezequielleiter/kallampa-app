"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { PageContainer, PageHeader } from "@/components/kallampa/PageHeader";
import { NotaFormCard } from "@/components/notas/NotaFormCard";
import { useBreadcrumbs } from "@/components/shared/Breadcrumbs";
import { apiFetch } from "@/lib/api-client";
import type { Nota } from "@/lib/types";

export default function NuevaNotaPage() {
  const router = useRouter();
  const t = useTranslations("pages.notasNueva");
  const tNav = useTranslations("nav");
  useBreadcrumbs([{ label: tNav("notas"), href: "/notas" }, { label: t("title") }]);
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function handleGuardar() {
    if (!titulo.trim()) {
      setError(t("tituloRequerido"));
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      const nota = await apiFetch<Nota>("/api/notas", {
        method: "POST",
        body: JSON.stringify({ titulo, contenido }),
      });
      toast.success(t("createdSuccess"));
      router.push(`/notas/${nota._id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("createError"));
    } finally {
      setGuardando(false);
    }
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
        autoFocus
        onCancel={() => router.push("/notas")}
        onSubmit={handleGuardar}
      />
    </PageContainer>
  );
}
