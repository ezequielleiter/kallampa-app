import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

const inputClassName =
  "h-9 w-full min-w-0 rounded-md border border-divider bg-surface px-2.5 py-1.5 text-sm text-foreground caret-accent transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-text-subtle hover:border-text/45 focus-visible:border-accent focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-danger aria-invalid:shadow-[0_0_0_1px_var(--color-danger)]"

// Input de Kallampa. `prefix`/`suffix` muestran la unidad dentro del campo
// ("$", "kg", "ml") sin que sea parte del valor.
function Input({
  className,
  type,
  prefix,
  suffix,
  ...props
}: Omit<React.ComponentProps<"input">, "prefix"> & {
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}) {
  const input = (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        inputClassName,
        prefix != null && "pl-6",
        suffix != null && "pr-9",
        className
      )}
      {...props}
    />
  )
  if (prefix == null && suffix == null) return input
  return (
    <div className="relative w-full">
      {prefix != null && (
        <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[13px] text-text-subtle">
          {prefix}
        </span>
      )}
      {input}
      {suffix != null && (
        <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[13px] text-text-subtle">
          {suffix}
        </span>
      )}
    </div>
  )
}

export { Input, inputClassName }
