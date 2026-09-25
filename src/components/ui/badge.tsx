import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Tag de Kallampa. Las variantes conservan los nombres de shadcn, con la
// semantica del DS (el mapeo estado → variante vive en kallampa/StatusTag):
//   default     → acento relleno   (activo/listo: colonizado, fructificando)
//   secondary   → contorno acento  (en progreso: colonizando, incubando)
//   outline     → neutro           (terminado: usado, finalizado)
//   destructive → coral           (contaminado / error)
const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-[6px] border border-transparent px-2.5 py-[3px] text-[11px] leading-[14px] tracking-[0.02em] whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-accent-800 text-accent-100",
        secondary: "border-accent py-[2px] text-accent",
        outline: "bg-neutral-800 text-neutral-100",
        destructive: "bg-danger-bg text-danger-text",
        ghost: "text-text-muted",
        link: "text-accent-300 underline-offset-4 hover:underline",
      },
      strike: {
        true: "line-through opacity-80",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      strike: false,
    },
  }
)

function Badge({
  className,
  variant = "default",
  strike = false,
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant, strike }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
