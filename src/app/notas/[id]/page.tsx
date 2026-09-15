"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
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
  const [nota, setNota] = useState<Nota | null>(null);
  const [loading, setLoading] = useState(true);
  const [borrarOpen, setBorrarOpen] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const data = await apiFetch<Nota>(`/api/notas/${params.id}`);
      setNota(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cargar la nota");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void Promise.resolve().then(() => cargar());
  }, [cargar]);

  async function handleBorrar() {
    setBorrando(true);
    try {
      await apiFetch(`/api/notas/${params.id}`, { method: "DELETE" });
      toast.success("Nota eliminada");
      router.push("/notas");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar la nota");
      setBorrando(false);
    }
  }

  if (loading) {
    return <p className="p-4 text-sm text-muted-foreground">Cargando…</p>;
  }

  if (!nota) {
    return <p className="p-4 text-sm text-muted-foreground">Nota no encontrada.</p>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push("/notas")}>
          ← Volver a notas
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/notas/${nota._id}/editar`)}
          >
            <Pencil /> Editar
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setBorrarOpen(true)}>
            <Trash2 /> Eliminar
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="text-xl font-semibold">{nota.titulo}</h1>
            <span className="text-xs text-muted-foreground">
              Última edición: {formatFechaCorta(nota.updatedAt)}
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
            <AlertDialogTitle>Eliminar &ldquo;{nota.titulo}&rdquo;</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer: la nota se borra por completo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={borrando} onClick={handleBorrar}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
