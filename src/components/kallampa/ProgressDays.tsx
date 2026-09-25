import { cn } from "@/lib/utils";
import { statusTone } from "./StatusTag";

/** Barra de dias transcurridos sobre esperados ("4 / 14"). */
export function ProgressDays({
  value,
  total,
  estado,
  late = false,
  width = 56,
}: {
  value: number;
  total: number;
  estado?: string;
  /** Pasado de los dias esperados: la barra y el texto pasan a coral. */
  late?: boolean;
  width?: number;
}) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(total, 1)) * 100));
  const tone = estado ? statusTone(estado) : "progress";
  return (
    <div className="flex items-center gap-2">
      <span
        className="block h-1 overflow-hidden rounded-full bg-neutral-800"
        style={{ width }}
      >
        <span
          className={cn(
            "block h-full transition-[width] duration-400",
            tone === "danger" || late
              ? "bg-danger"
              : tone === "done" || tone === "discarded"
                ? "bg-neutral-500"
                : "bg-accent"
          )}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span
        className={cn(
          "text-xs tabular-nums",
          late ? "text-danger-text" : "text-text-muted"
        )}
      >
        {value} / {total}
      </span>
    </div>
  );
}
