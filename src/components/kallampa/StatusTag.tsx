"use client";

import type * as React from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/**
 * Un unico mapeo estado → tono para toda la app (ver README del DS,
 * "Estados de dominio"):
 *   en progreso  → contorno de acento (colonizando, incubando, pendiente)
 *   activo/listo → relleno de acento  (colonizado, fructificando, en curso)
 *   terminado    → neutro             (usado, finalizado, vacio, hecha)
 *   descartado   → neutro tachado
 *   contaminado  → coral
 */
export type StatusTone = "progress" | "active" | "done" | "discarded" | "danger";

const TONE_BY_ESTADO: Record<string, StatusTone> = {
  colonizando: "progress",
  incubando: "progress",
  pendiente: "progress",
  colonizado: "active",
  fructificando: "active",
  en_progreso: "active",
  usado: "done",
  finalizado: "done",
  vacio: "done",
  hecha: "done",
  descartado: "discarded",
  contaminado: "danger",
};

export function statusTone(estado: string): StatusTone {
  return TONE_BY_ESTADO[estado] ?? "done";
}

const BADGE_VARIANT: Record<StatusTone, "default" | "secondary" | "outline" | "destructive"> = {
  progress: "secondary",
  active: "default",
  done: "outline",
  discarded: "outline",
  danger: "destructive",
};

export type StatusKind =
  | "lote"
  | "jar"
  | "placa"
  | "frascoLiquido"
  | "recipiente"
  | "tarea";

interface StatusTagProps extends Omit<React.ComponentProps<"span">, "children"> {
  kind: StatusKind;
  estado: string;
  /** Texto alternativo (p. ej. la etapa actual del lote en vez de "En curso"). */
  children?: React.ReactNode;
}

export function StatusTag({ kind, estado, children, className, ...rest }: StatusTagProps) {
  const t = useTranslations("estados");
  const tone = statusTone(estado);
  return (
    <Badge
      variant={BADGE_VARIANT[tone]}
      strike={tone === "discarded"}
      className={className}
      {...rest}
    >
      {children ?? t(`${kind}.${estado}`)}
    </Badge>
  );
}

/** Punto de estado de 8px: anillo para "en progreso", relleno para el resto. */
export function StatusDot({ estado, className }: { estado: string; className?: string }) {
  const tone = statusTone(estado);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        tone === "progress" && "shadow-[inset_0_0_0_1.5px_var(--color-accent)]",
        tone === "active" && "bg-accent",
        (tone === "done" || tone === "discarded") && "bg-neutral-500",
        tone === "danger" && "bg-danger",
        className
      )}
    />
  );
}
