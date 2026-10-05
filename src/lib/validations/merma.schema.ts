import { z } from "zod";
import { notasOpcional } from "@/lib/validations/venta.schema";

export const MOTIVOS_MERMA = ["vencido", "regalado", "consumo_propio", "otro"] as const;

export const mermaSchema = z.object({
  batchId: z.string().min(1, "id_requerido:Id requerido"),
  fecha: z.coerce.date("fecha_invalida:Fecha inválida"),
  kg: z
    .number("kg_invalido:Los kg tienen que ser mayores a 0")
    .positive("kg_invalido:Los kg tienen que ser mayores a 0"),
  motivo: z.enum(MOTIVOS_MERMA, "motivo_merma_invalido:Motivo inválido"),
  notas: notasOpcional,
});
export type MermaInput = z.infer<typeof mermaSchema>;
