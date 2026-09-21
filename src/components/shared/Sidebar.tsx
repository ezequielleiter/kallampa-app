"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { useAppLocale } from "@/components/shared/LocaleProvider";

const NAV_LINKS = [
  { href: "/", key: "produccion" as const, icon: Sprout },
  { href: "/clonacion", key: "micelio" as const, icon: FlaskConical },
  { href: "/calendario", key: "calendario" as const, icon: CalendarDays },
  { href: "/trazabilidad", key: "trazabilidad" as const, icon: Network },
  { href: "/notas", key: "notas" as const, icon: StickyNote },
  { href: "/frascos", key: "frascos" as const, icon: Tag },
  { href: "/catalogos", key: "catalogos" as const, icon: BookOpen },
  { href: "/estadisticas", key: "estadisticas" as const, icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const { locale, setLocale } = useAppLocale();

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
        🍄 {tCommon("appName")}
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
              {t(link.key)}
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
        <div className="flex items-center gap-1 px-1" aria-label={tCommon("language")}>
          <button
            type="button"
            onClick={() => setLocale("es")}
            className={cn(
              "rounded px-1.5 py-0.5 text-xs font-medium transition-colors",
              locale === "es"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            ES
          </button>
          <button
            type="button"
            onClick={() => setLocale("en")}
            className={cn(
              "rounded px-1.5 py-0.5 text-xs font-medium transition-colors",
              locale === "en"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            EN
          </button>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4 shrink-0" />
          {t("logout")}
        </button>
      </div>
    </aside>
  );
}
