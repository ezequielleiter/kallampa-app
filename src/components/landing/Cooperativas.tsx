import Image from "next/image";
import { useTranslations } from "next-intl";

/**
 * Seccion "Quienes somos": la autoria cooperativa de Kallampa (Teo y Lawal),
 * con la misma escala de titulo que el hero para que sea un punto alto del
 * recorrido y no una nota al pie.
 */
export function Cooperativas() {
  const t = useTranslations("pages.landing.coop");
  const placa =
    "flex min-h-[168px] flex-col justify-between gap-6 rounded-lg bg-surface p-6 shadow-md";
  return (
    <section
      id="cooperativas"
      className="landing-wrap scroll-mt-4 pb-[clamp(72px,9vw,112px)]"
    >
      <div className="border-t border-neutral-800 pt-[clamp(48px,7vw,88px)]">
        <h2 className="landing-reveal m-0 text-[clamp(36px,5.2vw,68px)] leading-[1.06] font-medium tracking-[-0.02em]">
          <span className="block">{t("titulo1")}</span>
          <span className="block text-accent-300">{t("titulo2")}</span>
        </h2>

        <div className="mt-[clamp(32px,5vw,56px)] grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-start gap-x-[clamp(32px,6vw,96px)] gap-y-10">
          <div className="landing-reveal flex flex-col gap-4 text-[17px] leading-7 text-text/82">
            <p className="m-0 max-w-[46ch]">{t("texto")}</p>
            <p className="m-0 max-w-[46ch]">{t("texto2")}</p>
          </div>

          <div className="landing-reveal grid grid-cols-2 gap-3.5">
            <div className={placa}>
              <Image
                src="/brand/teo-logo.png"
                alt="Teo"
                width={84}
                height={56}
                className="block h-14 w-auto"
              />
              <span className="text-[13px] text-text/64">{t("tipo")}</span>
            </div>
            {/* Falta el logo de Lawal (ver TODO.md): por ahora, el nombre en tipografia. */}
            <div className={placa}>
              <span className="text-[40px] leading-14 font-medium tracking-[-0.02em]">Lawal</span>
              <span className="text-[13px] text-text/64">{t("tipo")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
