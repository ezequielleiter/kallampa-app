"use client";

import type * as React from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";

export interface ChoiceItem {
  value: string;
  label: React.ReactNode;
  meta?: React.ReactNode;
  /** Se muestra a la derecha (p. ej. un <StatusTag/> o "ya usado"). */
  aside?: React.ReactNode;
  disabled?: boolean;
}

type ChoiceListProps = {
  name?: string;
  items: ChoiceItem[];
  invalid?: boolean;
  className?: string;
  empty?: React.ReactNode;
} & (
  | { type: "radio"; value: string | undefined; onChange: (v: string) => void }
  | { type: "checkbox"; value: string[]; onChange: (v: string[]) => void }
);

/**
 * Elegir frascos / micelio de origen. Los no elegibles se muestran
 * deshabilitados (no ocultos), con su estado a la derecha.
 */
export function ChoiceList(props: ChoiceListProps) {
  const { name, items, invalid = false, className, empty } = props;
  const autoName = useId();
  const multi = props.type === "checkbox";
  const isOn = (v: string) =>
    props.type === "checkbox" ? props.value.includes(v) : props.value === v;
  const toggle = (v: string) => {
    if (props.type === "checkbox") {
      const cur = props.value;
      props.onChange(cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
    } else {
      props.onChange(v);
    }
  };
  return (
    <div
      role={multi ? "group" : "radiogroup"}
      className={cn(
        "flex max-h-72 flex-col overflow-y-auto rounded-md",
        invalid
          ? "shadow-[inset_0_0_0_1px_var(--color-danger)]"
          : "shadow-[inset_0_0_0_1px_var(--color-divider)]",
        className
      )}
    >
      {items.length === 0 && empty && (
        <div className="px-3 py-3 text-center text-[13px] text-text-subtle">{empty}</div>
      )}
      {items.map((it, i) => {
        const on = isOn(it.value) && !it.disabled;
        return (
          <label
            key={it.value}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 text-[13px]",
              i > 0 && "border-t border-divider",
              it.disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer",
              on ? "bg-surface-selected" : !it.disabled && "hover:bg-hover"
            )}
          >
            <input
              type={props.type}
              name={name ?? autoName}
              checked={on}
              disabled={it.disabled}
              onChange={() => toggle(it.value)}
              className="m-0 accent-(--color-accent)"
            />
            <div className="min-w-0 flex-1">
              <div className="tabular-nums">{it.label}</div>
              {it.meta && <div className="text-[11.5px] text-text-subtle">{it.meta}</div>}
            </div>
            {it.aside && <span className="shrink-0 text-[11.5px] text-text-subtle">{it.aside}</span>}
          </label>
        );
      })}
    </div>
  );
}
