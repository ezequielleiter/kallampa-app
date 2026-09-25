import Image from "next/image";
import { useTranslations } from "next-intl";

/** Pie: creditos intercooperativos (Teo y Lawal). */
export function LandingFooter() {
  const t = useTranslations("pages.landing.footer");
  const chip =
    "flex h-[34px] items-center gap-2 rounded-md px-3 text-text shadow-sm";
  return (
    <div className="landing-wrap pb-14">
      <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pt-8 text-[13px] leading-none text-text/55">
        <div className="flex flex-wrap items-center gap-3">
          <span>{t("desarrollado")}</span>
          <div className="flex items-center gap-2.5">
            <span className={chip}>
              <Image
                src="/brand/teo-logo.png"
                alt="Teo"
                width={33}
                height={22}
                className="block h-[22px] w-auto opacity-90"
              />
            </span>
            {/* Falta el logo de Lawal (ver TODO.md): por ahora, solo el nombre. */}
            <span className={chip}>Lawal</span>
          </div>
        </div>
        <span>{t("copyright")}</span>
      </footer>
    </div>
  );
}
