"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sprout,
  FlaskConical,
  Network,
  StickyNote,
  Tag,
  BookOpen,
  BarChart3,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Producción", icon: Sprout },
  { href: "/clonacion", label: "Micelio", icon: FlaskConical },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/trazabilidad", label: "Trazabilidad", icon: Network },
  { href: "/notas", label: "Notas", icon: StickyNote },
  { href: "/frascos", label: "Frascos", icon: Tag },
  { href: "/catalogos", label: "Catálogos", icon: BookOpen },
  { href: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-background">
      <Link
        href="/"
        className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 text-base font-semibold"
      >
        🍄 Cultivo
      </Link>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {NAV_LINKS.map((link) => {
          const active =
            link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
