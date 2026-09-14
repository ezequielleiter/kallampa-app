"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--brand-ink-700)",
          "--normal-text": "var(--brand-bone-100)",
          "--normal-border": "var(--brand-ink-700)",
          "--success-bg": "var(--brand-ink-700)",
          "--success-text": "var(--brand-bone-100)",
          "--success-border": "var(--brand-ink-700)",
          "--error-bg": "var(--brand-orange)",
          "--error-text": "var(--brand-ink-900)",
          "--error-border": "var(--brand-orange)",
          "--warning-bg": "var(--brand-orange)",
          "--warning-text": "var(--brand-ink-900)",
          "--warning-border": "var(--brand-orange)",
          "--border-radius": "999px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast shadow-lg",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
