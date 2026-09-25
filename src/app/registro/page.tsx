"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/kallampa/Field";
import { AuthShell } from "@/components/shared/AuthShell";
import { apiFetch } from "@/lib/api-client";
import { saveSession, type Session } from "@/lib/session";
import { registerSchema } from "@/lib/validations/auth.schema";
import { translateErrorMessage } from "@/lib/error-messages";

// Extiende el schema del backend con un campo puramente client-side
// (confirmarPassword) que nunca se envía a la API.
const registerFormSchema = registerSchema
  .extend({
    confirmarPassword: z.string().min(1, "confirmar_password_requerida:Confirmá la contraseña"),
  })
  .refine((data) => data.password === data.confirmarPassword, {
    message: "passwords_no_coinciden:Las contraseñas no coinciden",
    path: ["confirmarPassword"],
  });

type RegisterFormInput = z.infer<typeof registerFormSchema>;

export default function RegistroPage() {
  const router = useRouter();
  const t = useTranslations("auth.register");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof registerFormSchema>, unknown, RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { username: "", email: "", password: "", confirmarPassword: "" },
  });

  async function onSubmit(data: RegisterFormInput) {
    try {
      const result = await apiFetch<Session>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password,
        }),
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
        <>
          {t("hasAccount")}{" "}
          <Link href="/login" className="text-accent-300 hover:text-accent-100">
            {t("loginLink")}
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-3.5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field
          label={t("usernameLabel")}
          htmlFor="username"
          error={errors.username && translateErrorMessage(errors.username.message)}
        >
          <Input id="username" autoComplete="username" autoFocus aria-invalid={!!errors.username} {...register("username")} />
        </Field>
        <Field
          label={t("emailLabel")}
          htmlFor="email"
          error={errors.email && translateErrorMessage(errors.email.message)}
        >
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field
          label={t("passwordLabel")}
          htmlFor="password"
          error={errors.password && translateErrorMessage(errors.password.message)}
        >
          <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
        </Field>
        <Field
          label={t("confirmPasswordLabel")}
          htmlFor="confirmarPassword"
          error={errors.confirmarPassword && translateErrorMessage(errors.confirmarPassword.message)}
        >
          <Input id="confirmarPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.confirmarPassword} {...register("confirmarPassword")} />
        </Field>
        <Button type="submit" size="block" loading={isSubmitting} className="mt-1.5">
          {t("submit")}
        </Button>
      </form>
    </AuthShell>
  );
}
