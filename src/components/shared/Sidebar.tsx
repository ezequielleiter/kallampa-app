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
import { NAV_GROUPS, navLinkForPath } from "@/components/shared/nav";

const itemClassName =
  "flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13.5px] transition-colors [&_svg]:size-4 [&_svg]:shrink-0";

/** Barra lateral fija del panel; desde md. En el celular va en un Sheet (MobileNav). */
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-(--sidebar-width) shrink-0 flex-col gap-0.5 border-r border-divider px-2.5 py-4 md:flex">
      <SidebarContent />
    </aside>
  );
}

/** Logo, navegacion y cuenta; compartido por la barra lateral y el menu del celular. */
export function SidebarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
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
    <>
      <Link href="/lotes" className="rounded-md px-2 pt-0.5 pb-[18px]">
        <Logo size={24} />
      </Link>
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div
            key={group.key}
            role="group"
            aria-labelledby={`nav-${group.key}`}
            className="flex flex-col gap-0.5"
          >
            <span
              id={`nav-${group.key}`}
              className="px-2.5 pb-1 text-[11px] tracking-[0.08em] text-text-subtle uppercase"
            >
              {t(`grupos.${group.key}`)}
            </span>
            {group.links.map((link) => {
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
                      ? "bg-surface-selected text-foreground [&_svg]:text-accent"
                      : "text-text-muted hover:bg-hover hover:text-foreground"
                  )}
                >
                  <Icon />
                  {t(link.key)}
                </Link>
              );
            })}
          </div>
        ))}
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
        <p className="m-0 px-2.5 pt-2 text-xs leading-4 text-text-subtle">
          {tCommon("hechoPor")}
        </p>
      </div>
      <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
