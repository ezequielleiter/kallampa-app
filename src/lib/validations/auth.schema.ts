import { z } from "zod";
import { LOCALES } from "@/i18n/messages";

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "usuario_muy_corto:El nombre de usuario debe tener al menos 3 caracteres"),
  email: z.string().trim().email("email_invalido:Email invalido"),
  password: z.string().min(8, "password_muy_corta:La contraseña debe tener al menos 8 caracteres"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identificador: z.string().trim().min(1, "identificador_requerido:Usuario o email requerido"),
  password: z.string().min(1, "password_requerida:Contraseña requerida"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const updateMeSchema = z.object({
  locale: z.enum(LOCALES, "locale_invalido:Idioma invalido"),
});
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
