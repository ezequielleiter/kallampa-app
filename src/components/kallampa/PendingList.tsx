import type * as React from "react";
import { cn } from "@/lib/utils";

export interface PendingItem {
  key: string;
  icon: React.ReactNode;
  text: React.ReactNode;
  tone?: "accent" | "danger";
}

/** "Pendientes": proximos pasos derivados del estado, con borde de acento. */
export function PendingList({
  title,
  items,
  empty,
}: {
  title: string;
  items: PendingItem[];
  empty: string;
}) {
  return (
    <div className="rounded-lg bg-surface-card p-4 shadow-[0_0_0_1px_var(--color-accent)]">
      <div className="text-xs tracking-[0.05em] text-accent uppercase">{title}</div>
      <ul className="mt-3 flex flex-col gap-2.5 text-[13px] leading-[18px]">
        {items.map((it) => (
          <li key={it.key} className="flex items-start gap-2">
            <span
              className={cn(
                "mt-px flex shrink-0 [&_svg]:size-4",
                it.tone === "danger" ? "text-danger-text" : "text-accent"
              )}
            >
              {it.icon}
            </span>
            <span>{it.text}</span>
          </li>
        ))}
        {items.length === 0 && <li className="text-text-subtle">{empty}</li>}
      </ul>
    </div>
  );
}
