"use client"

import * as React from "react"
import { cn } from "cn"

// Tabla de Kallampa: encabezados en mayusculas de 11px, filas de 44px y una
// divisoria por fila que se desvanece en los extremos (48px) en vez de un
// borde duro. Scroll horizontal en anchos chicos; `minWidth` evita que las
// columnas se aplasten.
function Table({
  className,
  minWidth,
  containerClassName,
  style,
  ...props
}: React.ComponentProps<"table"> & {
  minWidth?: number
  containerClassName?: string
}) {
  return (
    <div
      data-slot="table-container"
      className={cn("relative w-full overflow-x-auto", containerClassName)}
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom border-collapse text-[13px] tabular-nums", className)}
        style={minWidth ? { minWidth, ...style } : style}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "[&_tr]:bg-(image:--rule-fade) [&_tr]:bg-[length:100%_1px] [&_tr]:bg-bottom [&_tr]:bg-no-repeat [&_tr:hover]:bg-(image:--rule-fade)",
        className
      )}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={className} {...props} />
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("font-medium", className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "bg-(image:--rule-fade-soft) bg-[length:100%_1px] bg-bottom bg-no-repeat transition-colors",
        "hover:[background-image:linear-gradient(color-mix(in_srgb,var(--color-text)_4%,transparent),color-mix(in_srgb,var(--color-text)_4%,transparent)),var(--rule-fade-soft)] hover:bg-[length:100%_100%,100%_1px]",
        "data-[state=selected]:bg-surface-selected",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-9 px-2 text-left align-middle text-[11px] font-normal tracking-[0.08em] whitespace-nowrap text-text/60 uppercase [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "h-11 px-2 py-1.5 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-[13px] text-text-subtle", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
