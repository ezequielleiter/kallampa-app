import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2.5 py-0.5 font-mono text-[11px] font-medium tracking-wide whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-[var(--brand-blue-700)]",
        secondary:
          "bg-[var(--brand-blue-100)] text-[var(--brand-blue-800)] [a]:hover:bg-[var(--brand-blue-100)]/70 dark:bg-[var(--accent)] dark:text-[var(--brand-blue-300)]",
        destructive:
          "bg-[var(--brand-orange-100)] text-[var(--brand-orange-700)] focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:text-[var(--brand-orange-300)] dark:focus-visible:ring-destructive/40 [a]:hover:bg-[var(--brand-orange-100)]/70",
        outline:
          "bg-muted text-foreground border-transparent [a]:hover:bg-muted/70",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
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
