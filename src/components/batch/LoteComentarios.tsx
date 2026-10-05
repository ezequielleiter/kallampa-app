"use client";

import { useEffect, useRef, useState } from "react";
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
import { useAppLocale } from "@/components/shared/LocaleProvider";
import { apiFetch } from "@/lib/api-client";
import type { ComentarioLote } from "@/lib/types";

interface LoteComentariosProps {
  batchId: string;
  comentarios: ComentarioLote[];
  onChanged: () => void;
}

/** Ctrl/⌘+Enter envia el textarea. */
function esEnviar(e: React.KeyboardEvent) {
  return e.key === "Enter" && (e.ctrlKey || e.metaKey);
}

/**
 * Comentarios del lote: card en la columna derecha del detalle (debajo de
 * Costos), con el hilo cronologico y la caja para escribir al pie. El hilo
 * tiene alto maximo con scroll propio para que la columna (sticky) no crezca
 * sin limite.
 */
export function LoteComentarios({ batchId, comentarios, onChanged }: LoteComentariosProps) {
  const t = useTranslations("components.loteComentarios");
  const tCommon = useTranslations("common");
  const { locale } = useAppLocale();
  const [nuevo, setNuevo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [editando, setEditando] = useState<{ id: string; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ComentarioLote | null>(null);
  const [deleting, setDeleting] = useState(false);
  const hiloRef = useRef<HTMLUListElement>(null);

  // Al cargar y al sumar un comentario, el hilo queda scrolleado al ultimo.
  useEffect(() => {
    const hilo = hiloRef.current;
    if (hilo) hilo.scrollTop = hilo.scrollHeight;
  }, [comentarios.length]);

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
    <div className="rounded-lg bg-surface-card p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="m-0 text-sm font-medium">{t("title")}</h2>
        <span className="text-[12.5px] text-text-subtle tabular-nums">
          {t("meta", { count: comentarios.length })}
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-3">
        {comentarios.length === 0 ? (
          <p className="m-0 text-[13px] text-text-subtle">{t("emptyState")}</p>
        ) : (
          <ul
            ref={hiloRef}
            className="m-0 flex max-h-[min(22rem,30vh)] list-none flex-col divide-y divide-divider overflow-y-auto p-0"
          >
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
    </div>
  );
}
