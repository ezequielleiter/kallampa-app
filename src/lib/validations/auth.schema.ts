import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().trim().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  email: z.string().trim().email("Email invalido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identificador: z.string().trim().min(1, "Usuario o email requerido"),
  password: z.string().min(1, "Contraseña requerida"),
});
export type LoginInput = z.infer<typeof loginSchema>;
