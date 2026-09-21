"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sprout,
  FlaskConical,
  Network,
  StickyNote,
  Tag,
  BookOpen,
  BarChart3,
  CalendarDays,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clearSession, getSession, type Session } from "@/lib/session";

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
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    void Promise.resolve().then(() => setSession(getSession()));
  }, []);

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

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
      <div className="flex flex-col gap-2 border-t border-border p-3">
        {session && (
          <p className="truncate px-1 text-sm font-medium text-foreground">
            {session.user.username}
          </p>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
