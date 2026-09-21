"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
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
import { loginSchema, type LoginInput } from "@/lib/validations/auth.schema";

interface LoginResponse {
  token: string;
  apiKey: string;
  user: { _id: string; username: string; email: string };
}

export default function LoginPage() {
  const router = useRouter();
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
      const result = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      saveSession(result);
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al iniciar sesión");
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
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription>Ingresá tus credenciales para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-1.5">
                <Label>Usuario o email</Label>
                <Input {...register("identificador")} autoFocus />
                {errors.identificador && (
                  <p className="text-xs text-destructive">{errors.identificador.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Contraseña</Label>
                <Input type="password" {...register("password")} />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>
              <Button type="submit" disabled={isSubmitting} className="mt-2">
                Iniciar sesión
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              ¿No tenés cuenta?{" "}
              <Link href="/registro" className="font-medium text-primary hover:underline">
                Registrate
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
