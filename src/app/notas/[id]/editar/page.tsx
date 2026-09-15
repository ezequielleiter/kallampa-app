"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotaEditor } from "@/components/notas/NotaEditor";
import { apiFetch } from "@/lib/api-client";
import type { Nota } from "@/lib/types";

export default function EditarNotaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const nota = await apiFetch<Nota>(`/api/notas/${params.id}`);
      setTitulo(nota.titulo);
      setContenido(nota.contenido);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cargar la nota");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void Promise.resolve().then(() => cargar());
  }, [cargar]);

  async function handleGuardar() {
    if (!titulo.trim()) {
      setError("El título es requerido");
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      await apiFetch<Nota>(`/api/notas/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ titulo, contenido }),
      });
      toast.success("Nota actualizada");
      router.push(`/notas/${params.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la nota");
    } finally {
      setGuardando(false);
    }
  }

  if (loading) {
    return <p className="p-4 text-sm text-muted-foreground">Cargando…</p>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">Editar nota</h1>
      <Card>
        <CardHeader>
          <CardTitle>Contenido</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Título</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Nota (Markdown)</Label>
            <NotaEditor content={contenido} onChange={setContenido} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/notas/${params.id}`)}
            >
              Cancelar
            </Button>
            <Button type="button" disabled={guardando} onClick={handleGuardar}>
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
