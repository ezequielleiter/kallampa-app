import { z } from "zod";
import { JAR_ESTADOS } from "@/models/Jar";

export const updateJarStateSchema = z.object({
  estado: z.enum(JAR_ESTADOS),
});
export type UpdateJarStateInput = z.infer<typeof updateJarStateSchema>;
