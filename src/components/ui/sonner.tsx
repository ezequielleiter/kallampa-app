"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CheckCircleIcon,
  InfoIcon,
  WarningIcon,
  WarningCircleIcon,
  CircleNotchIcon,
} from "@phosphor-icons/react"

// Toast de Kallampa: tarjeta abajo al centro, 3,2s, icono de acento (coral en
// errores). El texto nombra registro y resultado: "R04 creado", etc.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="bottom-center"
      duration={3200}
      className="toaster group"
      icons={{
        success: <CheckCircleIcon className="size-[17px] text-accent" />,
        info: <InfoIcon className="size-[17px] text-accent" />,
        warning: <WarningIcon className="size-[17px] text-danger-text" />,
        error: <WarningCircleIcon className="size-[17px] text-danger-text" />,
        loading: <CircleNotchIcon className="size-[17px] animate-[k-spin_.8s_linear_infinite] text-accent" />,
      }}
      style={
        {
          "--normal-bg": "var(--surface-card)",
          "--normal-text": "var(--color-text)",
          "--normal-border": "var(--color-neutral-500)",
          "--success-bg": "var(--surface-card)",
          "--success-text": "var(--color-text)",
          "--success-border": "var(--color-neutral-500)",
          "--error-bg": "var(--surface-card)",
          "--error-text": "var(--color-danger-text)",
          "--error-border": "var(--color-danger)",
          "--warning-bg": "var(--surface-card)",
          "--warning-text": "var(--color-danger-text)",
          "--warning-border": "var(--color-danger)",
          "--border-radius": "var(--radius-md)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast !gap-2 !px-3.5 !py-2.5 !text-[13px] !shadow-[0_0_0_1px_var(--color-neutral-500),0_16px_40px_rgba(0,0,0,.65)]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
