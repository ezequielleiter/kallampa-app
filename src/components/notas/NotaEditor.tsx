"use client";

import { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";

// `tiptap-markdown` extiende `editor.storage` en runtime, pero no trae una
// declaracion de tipos que lo amplie -- `Editor["storage"]` de @tiptap/react
// no lo conoce. Se tipa el acceso puntual en vez de castear el editor entero.
function getMarkdown(editor: Editor): string {
  return (editor.storage as unknown as { markdown: { getMarkdown(): string } }).markdown.getMarkdown();
}

// Tipografia de las notas (lectura y edicion): prose oscuro, titulos en 500
// (el DS nunca pasa de 500) y links en acento.
export const NOTA_PROSE_CLASSNAME =
  "prose prose-sm prose-invert max-w-none text-[13.5px] text-text-body prose-headings:font-medium prose-headings:tracking-[-0.01em] prose-headings:text-text prose-strong:font-medium prose-strong:text-text prose-a:text-accent-300 prose-a:underline-offset-3 hover:prose-a:text-accent-100 prose-code:text-accent-200 prose-li:marker:text-text-subtle prose-hr:border-divider prose-blockquote:border-accent-700 prose-blockquote:text-text-muted prose-th:text-text-muted";

interface NotaEditorProps {
  /** Markdown crudo actual/inicial. Si cambia externamente (ej. termina de
   * cargar una nota existente) y el editor no tiene el foco, se rehidrata. */
  content: string;
  onChange: (markdown: string) => void;
}

/**
 * Editor con renderizado en vivo de Markdown EN EL MISMO LUGAR donde se
 * escribe (no un split de texto crudo + preview aparte): las "input rules"
 * de `StarterKit` ya convierten `## texto` en un encabezado, `**texto**`
 * en negrita, `- texto` en lista, etc. apenas se tipean. `tiptap-markdown`
 * hace que el documento se pueda cargar/guardar como texto Markdown plano
 * (que es lo que persiste `Nota.contenido`), en vez de HTML.
 */
export function NotaEditor({ content, onChange }: NotaEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Markdown.configure({ html: false })],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: `${NOTA_PROSE_CLASSNAME} min-h-[280px] focus:outline-none`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(getMarkdown(editor));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const actual = getMarkdown(editor);
    // No pisar lo que el usuario esta tipeando: solo rehidratar si el
    // contenido externo cambio (ej. recien terminó de cargar una nota
    // existente) y el editor no tiene el foco en este momento.
    if (content !== actual && !editor.isFocused) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="rounded-md border border-divider bg-surface px-3.5 py-2.5 caret-accent transition-colors hover:border-text/45 focus-within:border-accent">
      <EditorContent editor={editor} />
    </div>
  );
}
