"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api-client";
import { saveSession, type Session } from "@/lib/session";
import { loginSchema, type LoginInput } from "@/lib/validations/auth.schema";
import { translateErrorMessage } from "@/lib/error-messages";
import { useAppLocale } from "@/components/shared/LocaleProvider";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("auth.login");
  const tCommon = useTranslations("common");
  const { locale, setLocale } = useAppLocale();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof loginSchema>, unknown, LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identificador: "", password: "" },
  });

  async function onSubmit(data: LoginInput) {
    try {
      const result = await apiFetch<Session>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      saveSession(result);
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("genericError"));
    }
  }

  return (
    <div className="flex min-h-full w-full items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center gap-1" aria-label={tCommon("language")}>
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
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-3xl">🍄</span>
          <h1 className="text-lg font-semibold">{tCommon("appName")}</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-1.5">
                <Label>{t("identificadorLabel")}</Label>
                <Input {...register("identificador")} autoFocus />
                {errors.identificador && (
                  <p className="text-xs text-destructive">
                    {translateErrorMessage(errors.identificador.message)}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("passwordLabel")}</Label>
                <Input type="password" {...register("password")} />
                {errors.password && (
                  <p className="text-xs text-destructive">
                    {translateErrorMessage(errors.password.message)}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={isSubmitting} className="mt-2">
                {t("submit")}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {t("noAccount")}{" "}
              <Link href="/registro" className="font-medium text-primary hover:underline">
                {t("registerLink")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
