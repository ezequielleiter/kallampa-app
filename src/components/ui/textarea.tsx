import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-[60px] w-full resize-y rounded-md border border-divider bg-surface px-2.5 py-2 text-sm text-foreground caret-accent transition-colors outline-none placeholder:text-text-subtle hover:border-text/45 focus-visible:border-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-danger",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
