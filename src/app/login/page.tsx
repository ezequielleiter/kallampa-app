"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/kallampa/Field";
import { AuthShell } from "@/components/shared/AuthShell";
import { useRegistroHabilitado } from "@/components/shared/useRegistroHabilitado";
import { apiFetch } from "@/lib/api-client";
import { saveSession, type Session } from "@/lib/session";
import { loginSchema, type LoginInput } from "@/lib/validations/auth.schema";
import { translateErrorMessage } from "@/lib/error-messages";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("auth.login");
  const registroHabilitado = useRegistroHabilitado();
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
    <AuthShell
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        registroHabilitado ? (
          <>
            {t("noAccount")}{" "}
            <Link href="/registro" className="text-accent-300 hover:text-accent-100">
              {t("registerLink")}
            </Link>
          </>
        ) : undefined
      }
    >
      <form className="flex flex-col gap-3.5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field
          label={t("identificadorLabel")}
          htmlFor="identificador"
          error={errors.identificador && translateErrorMessage(errors.identificador.message)}
        >
          <Input id="identificador" autoComplete="username" autoFocus aria-invalid={!!errors.identificador} {...register("identificador")} />
        </Field>
        <Field
          label={t("passwordLabel")}
          htmlFor="password"
          error={errors.password && translateErrorMessage(errors.password.message)}
        >
          <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register("password")} />
        </Field>
        <Button type="submit" size="block" loading={isSubmitting} className="mt-1.5">
          {t("submit")}
        </Button>
      </form>
    </AuthShell>
  );
}
