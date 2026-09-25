import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Card de seccion numerada ("01 Inoculacion en grano"): numero en acento,
 * titulo de 16px, meta en gris y acciones a la derecha.
 */
export function SectionCard({
  number,
  title,
  meta,
  actions,
  highlight = false,
  className,
  children,
}: {
  number?: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  highlight?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-lg bg-surface-card px-5 py-4 shadow-sm",
        highlight && "shadow-[0_0_0_1px_var(--color-accent)]",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1">
          {number && <span className="text-xs text-accent tabular-nums">{number}</span>}
          <h2 className="m-0 text-base font-medium">{title}</h2>
          {meta && <span className="text-[12.5px] text-text-subtle tabular-nums">{meta}</span>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-1.5">{actions}</div>}
      </div>
      {children != null && <div className="mt-3">{children}</div>}
    </section>
  );
}
