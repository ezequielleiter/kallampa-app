import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { CircleNotchIcon } from "@phosphor-icons/react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Kallampa: los primarios son de CONTORNO de acento sobre transparente, nunca
// rellenos. Hover = tinte del acento; foco = anillo de 2px (global en
// globals.css, :focus-visible).
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent bg-transparent text-sm leading-tight font-medium whitespace-nowrap transition-colors duration-150 select-none disabled:pointer-events-none disabled:opacity-45 aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[15px]",
  {
    variants: {
      variant: {
        default:
          "border-accent text-accent hover:bg-accent/12 active:bg-accent/22 aria-expanded:bg-accent/12",
        outline:
          "border-divider text-foreground hover:bg-hover active:bg-text/14 aria-expanded:bg-hover",
        secondary:
          "border-divider text-foreground hover:bg-hover active:bg-text/14 aria-expanded:bg-hover",
        ghost:
          "text-accent hover:bg-accent/10 active:bg-accent/18 aria-expanded:bg-accent/10",
        destructive:
          "border-danger/60 text-danger-text hover:bg-danger-bg active:bg-danger/25",
        link: "px-0! text-accent-300 underline-offset-4 hover:text-accent-100 hover:underline",
      },
      size: {
        default: "h-9 px-3",
        xs: "h-6 gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 px-2.5 text-[13px] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 px-4",
        block: "h-9 w-full px-3",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  loading = false,
  disabled,
  children,
  render,
  nativeButton,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & { loading?: boolean }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      render={render}
      // Con `render` (p. ej. un <Link>) el elemento no es un <button> nativo.
      nativeButton={nativeButton ?? render === undefined}
      {...props}
    >
      {loading && <CircleNotchIcon className="animate-[k-spin_.8s_linear_infinite]" />}
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
