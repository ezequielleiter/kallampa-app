const TONES = [
  "var(--color-accent)",
  "var(--color-accent-700)",
  "var(--color-neutral-500)",
  "var(--color-neutral-700)",
];

export interface CostItem {
  name: string;
  value: number;
}

/** Costos del lote: total, barra apilada y detalle por concepto. */
export function CostBreakdown({
  title,
  items,
  format,
}: {
  title: string;
  items: CostItem[];
  format: (n: number) => string;
}) {
  const total = items.reduce((a, i) => a + i.value, 0);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-[13px] tabular-nums">{format(total)}</span>
      </div>
      {total > 0 && (
        <div className="mt-3 flex h-1.5 gap-0.5 overflow-hidden rounded-[3px]">
          {items.map((c, i) => (
            <span
              key={c.name}
              className="transition-[flex] duration-400"
              style={{ flex: c.value, background: TONES[i % TONES.length] }}
            />
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-col gap-1.5">
        {items.map((c, i) => (
          <div key={c.name} className="flex justify-between text-[12.5px]">
            <span className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-[2px]"
                style={{ background: TONES[i % TONES.length] }}
              />
              {c.name}
            </span>
            <span className="text-text-body tabular-nums">{format(c.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
