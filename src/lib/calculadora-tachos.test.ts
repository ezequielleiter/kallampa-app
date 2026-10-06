import { describe, it, expect } from "vitest";
import { calcularTachos, kgPorTacho } from "./calculadora-tachos";

describe("kgPorTacho", () => {
  it("en kg es la capacidad; en litros usa la densidad", () => {
    expect(kgPorTacho(10, "kg", NaN)).toBe(10);
    expect(kgPorTacho(10, "L", 0.6)).toBeCloseTo(6, 6);
  });

  it("devuelve null con datos invalidos", () => {
    expect(kgPorTacho(0, "kg", 0.6)).toBeNull();
    expect(kgPorTacho(NaN, "kg", 0.6)).toBeNull();
    expect(kgPorTacho(10, "L", 0)).toBeNull();
  });
});

describe("calcularTachos", () => {
  it("division exacta: 30 kg en tachos de 10 kg son 3", () => {
    const r = calcularTachos(30, 10, "kg", 0.6);
    expect(r).not.toBeNull();
    expect(r!.tachosNecesarios).toBe(3);
    expect(r!.kgUltimoTacho).toBeCloseTo(10, 6);
  });

  it("redondea para arriba y dice cuanto va en el ultimo", () => {
    const r = calcularTachos(31, 10, "kg", 0.6);
    expect(r!.tachosNecesarios).toBe(4);
    expect(r!.tachosExactos).toBeCloseTo(3.1, 6);
    expect(r!.kgUltimoTacho).toBeCloseTo(1, 6);
  });

  it("no suma un tacho de mas por error de punto flotante", () => {
    expect(calcularTachos(0.3, 0.1, "kg", 0.6)!.tachosNecesarios).toBe(3);
    expect(calcularTachos(18, 10, "L", 0.6)!.tachosNecesarios).toBe(3);
  });

  it("en litros: 68,68 kg en tachos de 10 L a 0,6 kg/L son 12", () => {
    const r = calcularTachos(68.6812, 10, "L", 0.6);
    expect(r!.kgPorTacho).toBeCloseTo(6, 6);
    expect(r!.tachosNecesarios).toBe(12);
  });

  it("devuelve null con datos invalidos", () => {
    expect(calcularTachos(0, 10, "kg", 0.6)).toBeNull();
    expect(calcularTachos(NaN, 10, "kg", 0.6)).toBeNull();
    expect(calcularTachos(30, 0, "kg", 0.6)).toBeNull();
    expect(calcularTachos(30, 10, "L", 0)).toBeNull();
  });
});
