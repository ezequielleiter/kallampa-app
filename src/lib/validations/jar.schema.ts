import { z } from "zod";
import { JAR_ESTADOS } from "@/models/Jar";

export const updateJarStateSchema = z.object({
  estado: z.enum(JAR_ESTADOS, "estado_jar_invalido:Estado de frasco invalido"),
});
export type UpdateJarStateInput = z.infer<typeof updateJarStateSchema>;
