import type * as React from "react";
import { cn } from "@/lib/utils";

/** Contenedor de pagina del panel: hasta 1360px, padding 20×24 y 48 abajo. */
export function PageContainer({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex w-full max-w-(--content-max) flex-col gap-4 px-4 pt-5 pb-12 sm:px-6",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Titulo de vista (22px) + subtitulo (13px) y acciones a la derecha. */
export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className="m-0 text-[22px] leading-tight font-medium tracking-[-0.015em]">
          {title}
        </h1>
        {subtitle && <div className="mt-1 text-[13px] text-text-subtle">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Texto de estado vacio / cargando dentro de cards y tablas. */
export function EmptyState({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-2 py-6 text-center text-[13px] text-text-subtle", className)}>
      {children}
    </div>
  );
}
