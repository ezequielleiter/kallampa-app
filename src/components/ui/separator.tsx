"use client"

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
import { cn } from "cn"

// Las divisorias horizontales se desvanecen en los extremos (firma del DS).
function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 data-horizontal:h-px data-horizontal:w-full data-horizontal:bg-(image:--rule-fade) data-vertical:w-px data-vertical:self-stretch data-vertical:bg-divider",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
