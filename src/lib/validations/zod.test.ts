import { describe, expect, it } from "vitest";
import { createBatchSchema } from "./batch.schema";

describe("mensajes por defecto de zod", () => {
  it("formulario vacio: mensajes en español con codigo, incluido el refine", () => {
    const r = createBatchSchema.safeParse({ pesoGranoKg: NaN, fechaInicio: "" });
    expect(r.success).toBe(false);
    const msgs = Object.fromEntries(r.error!.issues.map((i) => [i.path.join("."), i.message]));
    expect(msgs.tipoGranoId).toBe("campo_requerido:Este campo es obligatorio");
    expect(msgs.pesoGranoKg).toBe("campo_requerido:Este campo es obligatorio");
    expect(msgs.fechaInicio).toBe("campo_requerido:Este campo es obligatorio");
    expect(msgs.fungusTypeId).toMatch(/^hongo_o_frasco_liquido_origen_requerido:/);
  });

  it("los mensajes propios del schema siguen ganando", () => {
    const r = createBatchSchema.safeParse({ pesoGranoKg: -1 });
    const m = r.error!.issues.find((i) => i.path[0] === "pesoGranoKg")!.message;
    expect(m).toMatch(/^numero_positivo_requerido:/);
  });
});
