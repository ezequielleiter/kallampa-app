import { describe, it, expect } from "vitest";
import * as A from "@/components/iso/audit.mjs";
import { RECORDER } from "./geometry";
import { P } from "./view";

describe("figura del invernadero de fructificacion", () => {
  it("la geometria pasa la auditoria de anatomy", () => {
    const result = A.audit(RECORDER, P);
    const fallas = A.failures(result);
    if (fallas) console.log(A.report(result, { limit: 40 }));
    expect(fallas).toBe(0);
  }, 300_000);
});
