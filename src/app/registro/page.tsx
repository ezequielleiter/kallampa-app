"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { saveSession } from "@/lib/session";
import { registerSchema } from "@/lib/validations/auth.schema";

// Extiende el schema del backend con un campo puramente client-side
// (confirmarPassword) que nunca se envía a la API.
const registerFormSchema = registerSchema
  .extend({
    confirmarPassword: z.string().min(1, "Confirmá la contraseña"),
  })
  .refine((data) => data.password === data.confirmarPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmarPassword"],
  });

type RegisterFormInput = z.infer<typeof registerFormSchema>;

interface RegisterResponse {
  token: string;
  apiKey: string;
  user: { _id: string; username: string; email: string };
}

export default function RegistroPage() {
  const router = useRouter();
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
      const result = await apiFetch<RegisterResponse>("/api/auth/register", {
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
      toast.error(err instanceof Error ? err.message : "Error al registrarse");
    }
  }

  return (
    <div className="flex min-h-full w-full items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-3xl">🍄</span>
          <h1 className="text-lg font-semibold">Cultivo</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Crear cuenta</CardTitle>
            <CardDescription>Registrate para empezar a usar el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-1.5">
                <Label>Usuario</Label>
                <Input {...register("username")} autoFocus />
                {errors.username && (
                  <p className="text-xs text-destructive">{errors.username.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Email</Label>
                <Input type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Contraseña</Label>
                <Input type="password" {...register("password")} />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Confirmar contraseña</Label>
                <Input type="password" {...register("confirmarPassword")} />
                {errors.confirmarPassword && (
                  <p className="text-xs text-destructive">{errors.confirmarPassword.message}</p>
                )}
              </div>
              <Button type="submit" disabled={isSubmitting} className="mt-2">
                Registrarme
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              ¿Ya tenés cuenta?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Iniciá sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
