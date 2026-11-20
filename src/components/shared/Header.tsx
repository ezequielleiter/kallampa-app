"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CaretRightIcon, ListIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import type { JarSearchResult } from "@/lib/types";
import { inputClassName } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useBreadcrumbsState, type Crumb } from "@/components/shared/Breadcrumbs";
import { navLinkForPath } from "@/components/shared/nav";
import { SidebarContent } from "@/components/shared/Sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

// Topbar del panel: ruta (breadcrumbs) a la izquierda y busqueda por N° de
// guia a la derecha. Pegajosa, fondo al 88% + blur de 8px.
export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("header");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const declared = useBreadcrumbsState();
  const [numeroGuia, setNumeroGuia] = useState("");
  const [buscando, setBuscando] = useState(false);

  const section = navLinkForPath(pathname);
  const crumbs: Crumb[] =
    declared ?? (section ? [{ label: tNav(section.key), href: section.href }] : []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const value = numeroGuia.trim();
    if (!value) return;
    setBuscando(true);
    try {
      const jar = await apiFetch<JarSearchResult>(
        `/api/jars/search?numeroGuia=${encodeURIComponent(value)}`
      );
      if (!jar.batch) {
        toast.error(t("jarWithoutBatch"));
        return;
      }
      setNumeroGuia("");
      router.push(`/lotes/${jar.batch._id}`);
    } catch {
      toast.error(t("jarNotFound"));
    } finally {
      setBuscando(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex min-h-(--topbar-height) shrink-0 items-center justify-between gap-4 border-b border-divider bg-bg/88 px-4 py-3 backdrop-blur-[8px] sm:px-6">
      <MobileNav />
      <nav
        aria-label={tCommon("breadcrumb")}
        className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px] text-text-subtle"
      >
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <Fragment key={`${c.label}-${i}`}>
              {i > 0 && <CaretRightIcon className="hidden size-[11px] shrink-0 md:block" />}
              {c.href && !last ? (
                <Link href={c.href} className="hidden whitespace-nowrap hover:text-foreground md:inline">
                  {c.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={cn("truncate whitespace-nowrap", last && "text-foreground")}
                >
                  {c.label}
                </span>
              )}
            </Fragment>
          );
        })}
      </nav>
      <form onSubmit={handleSearch} role="search" className="relative w-40 shrink-0 sm:w-[260px]">
        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-text-subtle" />
        <input
          value={numeroGuia}
          onChange={(e) => setNumeroGuia(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          aria-busy={buscando || undefined}
          disabled={buscando}
          className={cn(inputClassName, "pl-[30px]")}
        />
      </form>
    </header>
  );
}

/** Boton de menu + Sheet con la navegacion, solo debajo de md. */
function MobileNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Cerrar al navegar.
  useEffect(() => {
    void Promise.resolve().then(() => setOpen(false));
  }, [pathname]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("openMenu")}
        className="-ml-1.5 shrink-0 text-text-muted hover:text-foreground md:hidden"
        onClick={() => setOpen(true)}
      >
        <ListIcon className="size-5" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 gap-0.5 px-2.5 py-4">
          <SheetTitle className="sr-only">{t("openMenu")}</SheetTitle>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
