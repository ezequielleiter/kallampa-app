"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { DotsThreeIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SectionCard } from "@/components/kallampa/SectionCard";
import { useAppLocale } from "@/components/shared/LocaleProvider";
import { apiFetch } from "@/lib/api-client";
import type { ComentarioLote } from "@/lib/types";

interface ComentariosSectionProps {
  batchId: string;
  comentarios: ComentarioLote[];
  onChanged: () => void;
}

/** Ctrl/⌘+Enter envia el textarea. */
function esEnviar(e: React.KeyboardEvent) {
  return e.key === "Enter" && (e.ctrlKey || e.metaKey);
}

export function ComentariosSection({ batchId, comentarios, onChanged }: ComentariosSectionProps) {
  const t = useTranslations("components.comentariosSection");
  const tCommon = useTranslations("common");
  const { locale } = useAppLocale();
  const [nuevo, setNuevo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [editando, setEditando] = useState<{ id: string; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ComentarioLote | null>(null);
  const [deleting, setDeleting] = useState(false);

  const base = `/api/batches/${batchId}/comentarios`;
  const fechaHora = (iso: string) =>
    new Date(iso).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" });

  async function comentar() {
    if (!nuevo.trim() || enviando) return;
    setEnviando(true);
    try {
      await apiFetch<ComentarioLote[]>(base, {
        method: "POST",
        body: JSON.stringify({ texto: nuevo }),
      });
      setNuevo("");
      toast.success(t("createdMessage"));
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorMessage"));
    } finally {
      setEnviando(false);
    }
  }

  async function guardarEdicion() {
    if (!editando || !editando.texto.trim() || guardando) return;
    setGuardando(true);
    try {
      await apiFetch<ComentarioLote[]>(`${base}/${editando.id}`, {
        method: "PATCH",
        body: JSON.stringify({ texto: editando.texto }),
      });
      setEditando(null);
      toast.success(t("updatedMessage"));
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorMessage"));
    } finally {
      setGuardando(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch<ComentarioLote[]>(`${base}/${deleteTarget._id}`, { method: "DELETE" });
      setDeleteTarget(null);
      toast.success(t("deletedMessage"));
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorMessage"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <SectionCard number="05" title={t("title")} meta={t("meta", { count: comentarios.length })}>
      <div className="flex flex-col gap-3">
        {comentarios.length === 0 ? (
          <p className="m-0 text-[13px] text-text-subtle">{t("emptyState")}</p>
        ) : (
          <ul className="m-0 flex list-none flex-col divide-y divide-divider p-0">
            {comentarios.map((c) => (
              <li key={c._id} className="py-2.5 first:pt-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-text-subtle tabular-nums">
                    {fechaHora(c.createdAt)}
                    {c.updatedAt !== c.createdAt && ` · ${t("editado")}`}
                  </span>
                  {editando?.id !== c._id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t("accionesDe", { fecha: fechaHora(c.createdAt) })}
                            className="text-text-muted hover:text-foreground"
                          >
                            <DotsThreeIcon weight="bold" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="min-w-40">
                        <DropdownMenuItem onClick={() => setEditando({ id: c._id, texto: c.texto })}>
                          <PencilSimpleIcon /> {t("editar")}
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(c)}>
                          <TrashIcon /> {t("eliminar")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                {editando?.id === c._id ? (
                  <div className="mt-1.5 flex flex-col gap-2">
                    <Textarea
                      autoFocus
                      aria-label={t("editar")}
                      value={editando.texto}
                      onChange={(e) => setEditando({ id: c._id, texto: e.target.value })}
                      onKeyDown={(e) => {
                        if (esEnviar(e)) void guardarEdicion();
                        if (e.key === "Escape") setEditando(null);
                      }}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditando(null)}>
                        {tCommon("cancel")}
                      </Button>
                      <Button
                        size="sm"
                        loading={guardando}
                        disabled={!editando.texto.trim()}
                        onClick={guardarEdicion}
                      >
                        {t("guardar")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 mb-0 text-[13.5px] break-words whitespace-pre-wrap">
                    {c.texto}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 border-t border-divider pt-3">
          <Textarea
            aria-label={t("placeholder")}
            placeholder={t("placeholder")}
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            onKeyDown={(e) => {
              if (esEnviar(e)) void comentar();
            }}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-text-subtle">{t("atajo")}</span>
            <Button size="sm" loading={enviando} disabled={!nuevo.trim()} onClick={comentar}>
              {t("comentar")}
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmEliminarTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{deleteTarget?.texto}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" loading={deleting} onClick={handleDelete}>
              <TrashIcon /> {t("eliminar")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  );
}
