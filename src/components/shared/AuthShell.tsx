"use client";

import { useTranslations } from "next-intl";
import { Logo } from "@/components/kallampa/Logo";
import { SegmentedControl } from "@/components/kallampa/SegmentedControl";
import { useAppLocale } from "@/components/shared/LocaleProvider";
import type { Locale } from "@/i18n/messages";

/**
 * Pantallas de acceso (login / registro): fondo con resplandor de acento
 * arriba a la derecha y sombra abajo a la izquierda, logo animado y una card
 * de 400px.
 */
export function AuthShell({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const tCommon = useTranslations("common");
  const { locale, setLocale } = useAppLocale();
  return (
    <div className="glow-page flex min-h-dvh w-full flex-col items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-[400px] flex-col gap-7">
        <div className="flex justify-center">
          <Logo size={40} animated />
        </div>
        <div className="rounded-lg bg-surface-card px-6 pt-6 pb-5 shadow-sm">
          <h1 className="m-0 text-[22px] leading-tight font-medium tracking-[-0.015em]">
            {title}
          </h1>
          <p className="mt-1 mb-5 text-[13px] text-text-subtle">{subtitle}</p>
          {children}
          <p className="mt-5 text-center text-[13px] text-text-subtle">{footer}</p>
        </div>
        <div className="flex justify-center">
          <SegmentedControl<Locale>
            aria-label={tCommon("language")}
            value={locale}
            onChange={setLocale}
            options={[
              { value: "es", label: "ES" },
              { value: "en", label: "EN" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
