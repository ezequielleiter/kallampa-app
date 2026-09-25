"use client";

import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/kallampa/Field";
import { SegmentedControl } from "@/components/kallampa/SegmentedControl";
import { useAppLocale } from "@/components/shared/LocaleProvider";
import type { Locale } from "@/i18n/messages";

interface AccountSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Panel de configuraciones de cuenta. Hoy solo tiene idioma; a futuro suma
// mas secciones (ej. moneda local) debajo, sin cambiar la estructura.
export function AccountSettingsDialog({ open, onOpenChange }: AccountSettingsDialogProps) {
  const t = useTranslations("components.accountSettingsDialog");
  const tCommon = useTranslations("common");
  const { locale, setLocale } = useAppLocale();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <Field label={tCommon("language")}>
          <SegmentedControl<Locale>
            aria-label={tCommon("language")}
            value={locale}
            onChange={setLocale}
            options={[
              { value: "es", label: "Español" },
              { value: "en", label: "English" },
            ]}
          />
        </Field>
      </DialogContent>
    </Dialog>
  );
}
