"use client";

import type * as React from "react";
import { useTranslations } from "next-intl";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/**
 * Campo de formulario: label de 12px (+ "(opcional)"), el control, y debajo
 * el error en coral o, si no hay error, la ayuda en gris.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional = false,
  className,
  children,
}: {
  label?: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("common");
  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      {label && (
        <label htmlFor={htmlFor} className="mb-[5px] block text-xs text-text/70">
          {label}
          {optional && <span className="text-text-subtle"> ({t("optional")})</span>}
        </label>
      )}
      {children}
      {error ? (
        <div role="alert" className="mt-1.5 flex gap-[5px] text-xs leading-[17px] text-danger-text">
          <WarningCircleIcon className="mt-px size-3.5 shrink-0" />
          {error}
        </div>
      ) : hint ? (
        <div className="mt-1.5 text-xs leading-[17px] text-text-subtle">{hint}</div>
      ) : null}
    </div>
  );
}

/** Aviso no bloqueante (p. ej. EB > 150 %). */
export function FieldWarning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-[5px] rounded-md bg-danger-bg px-2.5 py-2 text-xs leading-[17px] text-danger-text">
      <WarningCircleIcon className="mt-px size-3.5 shrink-0" />
      {children}
    </div>
  );
}
