import type * as React from "react";
import { cn } from "@/lib/utils";

export interface KpiItem {
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
}

export function Kpi({ label, value, note }: KpiItem) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-text-subtle">{label}</div>
      <div className="mt-1 text-xl font-medium tracking-[-0.01em] tabular-nums">{value}</div>
      {note && <div className="mt-0.5 text-[11.5px] text-text-subtle">{note}</div>}
    </div>
  );
}

export function KpiGrid({
  items,
  min = 140,
  className,
}: {
  items: KpiItem[];
  min?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("grid gap-3", className)}
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))` }}
    >
      {items.map((k) => (
        <Kpi key={k.label} {...k} />
      ))}
    </div>
  );
}
