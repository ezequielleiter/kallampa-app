"use client";

import type * as React from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
}

/** Filtro / eleccion corta en linea (radios con estilo de botonera). */
export function SegmentedControl<T extends string>({
  name,
  options,
  value,
  onChange,
  block = false,
  className,
  "aria-label": ariaLabel,
}: {
  name?: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  block?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const autoName = useId();
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "flex-wrap overflow-hidden rounded-md border border-divider",
        block ? "flex" : "inline-flex",
        className
      )}
    >
      {options.map((o, i) => {
        const checked = value === o.value;
        return (
          <label
            key={o.value}
            className={cn(
              "relative inline-flex cursor-pointer items-center gap-1.5 px-3 py-[7px] text-[13px] transition-colors select-none [&_svg]:size-4",
              i > 0 && "border-l border-divider",
              block && "flex-auto justify-center",
              checked
                ? "text-accent shadow-[inset_0_0_0_1px_var(--color-accent)]"
                : "hover:bg-hover",
              "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:-outline-offset-2 has-[input:focus-visible]:outline-accent"
            )}
          >
            <input
              type="radio"
              name={name ?? autoName}
              value={o.value}
              checked={checked}
              onChange={() => onChange(o.value)}
              className="pointer-events-none absolute size-0 opacity-0"
            />
            {o.icon}
            {o.label}
            {o.count != null && (
              <span className="text-[11.5px] text-text-subtle tabular-nums">{o.count}</span>
            )}
          </label>
        );
      })}
    </div>
  );
}
