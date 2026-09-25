"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { GearIcon, SignOutIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { clearSession, getSession, type Session } from "@/lib/session";
import { AccountSettingsDialog } from "@/components/shared/AccountSettingsDialog";
import { Logo } from "@/components/kallampa/Logo";
import { NAV_LINKS, navLinkForPath } from "@/components/shared/nav";

const itemClassName =
  "flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13.5px] transition-colors [&_svg]:size-4 [&_svg]:shrink-0";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const t = useTranslations("nav");
  const activeHref = navLinkForPath(pathname)?.href;

  useEffect(() => {
    void Promise.resolve().then(() => setSession(getSession()));
  }, []);

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  const username = session?.user.username;

  return (
    <aside className="sticky top-0 flex h-dvh w-(--sidebar-width) shrink-0 flex-col gap-0.5 border-r border-divider px-2.5 py-4">
      <Link href="/lotes" className="rounded-md px-2 pt-0.5 pb-[18px]">
        <Logo size={24} />
      </Link>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {NAV_LINKS.map((link) => {
          const active = link.href === activeHref;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                itemClassName,
                active
                  ? "bg-surface-selected text-foreground shadow-[inset_2px_0_0_var(--color-accent)]"
                  : "text-text-muted hover:bg-hover hover:text-foreground"
              )}
            >
              <Icon />
              {t(link.key)}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-0.5 border-t border-divider pt-3">
        {username && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 text-[13px]">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-800 text-[11px]">
              {username.slice(0, 1).toUpperCase()}
            </span>
            <span className="truncate">{username}</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className={cn(itemClassName, "text-[13px] text-text-muted hover:bg-hover hover:text-foreground")}
        >
          <GearIcon />
          {t("settings")}
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className={cn(itemClassName, "text-[13px] text-text-muted hover:bg-hover hover:text-foreground")}
        >
          <SignOutIcon />
          {t("logout")}
        </button>
      </div>
      <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </aside>
  );
}
