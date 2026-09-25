import { CheckIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export type StepState = "done" | "active" | "pending";

export interface Step {
  name: string;
  meta?: string;
  state: StepState;
}

/** Etapas de un lote/clonacion: hecho = relleno + check, activo = halo. */
export function Stepper({ steps, min = 130 }: { steps: Step[]; min?: number }) {
  return (
    <ol
      className="grid gap-y-4"
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))` }}
    >
      {steps.map((s, i) => (
        <li key={s.name} className="flex flex-col gap-2" aria-current={s.state === "active" ? "step" : undefined}>
          <div className="flex items-center">
            <span
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] text-accent-100",
                s.state === "done" && "border-accent bg-accent-800",
                s.state === "active" &&
                  "border-accent bg-bg shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-accent)_20%,transparent)]",
                s.state === "pending" && "border-neutral-600 bg-bg"
              )}
            >
              {s.state === "done" && <CheckIcon className="size-[11px]" weight="bold" />}
            </span>
            <span
              className={cn(
                "mx-2 h-px flex-1",
                i === steps.length - 1 ? "bg-transparent" : "bg-accent-600"
              )}
            />
          </div>
          <div className="text-[13px] font-medium">{s.name}</div>
          {s.meta && <div className="text-xs text-text-subtle tabular-nums">{s.meta}</div>}
        </li>
      ))}
    </ol>
  );
}
