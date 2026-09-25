"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/kallampa/Field";
import { NotaEditor } from "@/components/notas/NotaEditor";

interface NotaFormCardProps {
  labels: { titulo: string; contenido: string; cancel: string; submit: string };
  titulo: string;
  onTituloChange: (value: string) => void;
  contenido: string;
  onContenidoChange: (value: string) => void;
  error: string | null;
  guardando: boolean;
  autoFocus?: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

// Formulario comun de "Nueva nota" y "Editar nota": titulo + editor Markdown
// en una card, con las acciones abajo a la derecha.
export function NotaFormCard({
  labels,
  titulo,
  onTituloChange,
  contenido,
  onContenidoChange,
  error,
  guardando,
  autoFocus,
  onCancel,
  onSubmit,
}: NotaFormCardProps) {
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-3.5 rounded-lg bg-surface-card px-5 py-4 shadow-sm"
    >
      <Field label={labels.titulo} error={error}>
        <Input
          value={titulo}
          onChange={(e) => onTituloChange(e.target.value)}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
        />
      </Field>

      <Field label={labels.contenido}>
        <NotaEditor content={contenido} onChange={onContenidoChange} />
      </Field>

      <div className="-mx-5 mt-1 -mb-4 flex justify-end gap-2 rounded-b-lg border-t border-divider bg-surface-inset px-5 py-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          {labels.cancel}
        </Button>
        <Button type="submit" loading={guardando}>
          {labels.submit}
        </Button>
      </div>
    </form>
  );
}
