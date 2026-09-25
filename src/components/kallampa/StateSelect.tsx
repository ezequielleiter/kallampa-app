"use client";

import { cn } from "@/lib/utils";
import { StatusDot } from "./StatusTag";

/** Cambiar el estado de un registro dentro de una tabla. */
export function StateSelect({
  value,
  options,
  onChange,
  label,
  disabled,
  width = 150,
}: {
  value: string;
  options: { value: string; label: string; disabled?: boolean }[];
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  width?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <StatusDot estado={value} />
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{ width }}
        className={cn(
          "min-h-[30px] cursor-pointer rounded-md border border-divider bg-surface px-2 py-[3px] text-[12.5px] text-foreground transition-colors hover:border-text/45 focus-visible:border-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
