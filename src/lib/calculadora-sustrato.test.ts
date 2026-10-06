import { describe, it, expect } from "vitest";
import {
  RECETA_BASE,
  calcularReceta,
  parseDecimal,
  resumenReceta,
} from "./calculadora-sustrato";

describe("calcularReceta", () => {
  it("con los pellets de la receta de base devuelve la receta de base", () => {
    const r = calcularReceta("pellets", 25.4012);
    expect(r).not.toBeNull();
    expect(r!.pelletsKg).toBeCloseTo(RECETA_BASE.pelletsKg, 6);
    expect(r!.aguaL).toBeCloseTo(RECETA_BASE.aguaL, 6);
    expect(r!.calKg).toBeCloseTo(RECETA_BASE.calKg, 6);
    expect(r!.granoKg).toBeCloseTo(RECETA_BASE.granoKg, 6);
  });

  it("con el grano de la receta de base devuelve la receta de base", () => {
    const r = calcularReceta("grano", 2.72);
    expect(r).not.toBeNull();
    expect(r!.pelletsKg).toBeCloseTo(RECETA_BASE.pelletsKg, 6);
    expect(r!.aguaL).toBeCloseTo(RECETA_BASE.aguaL, 6);
    expect(r!.calKg).toBeCloseTo(RECETA_BASE.calKg, 6);
    expect(r!.granoKg).toBeCloseTo(RECETA_BASE.granoKg, 6);
  });

  it("escala proporcionalmente desde 10 kg de pellets", () => {
    const r = calcularReceta("pellets", 10);
    expect(r).not.toBeNull();
    expect(r!.pelletsKg).toBeCloseTo(10, 6);
    expect(r!.aguaL).toBeCloseTo(15.75, 2);
    expect(r!.calKg).toBeCloseTo(0.22, 2);
    expect(r!.granoKg).toBeCloseTo(1.07, 2);
  });

  it("devuelve null con 0, negativos o valores no numericos", () => {
    expect(calcularReceta("pellets", 0)).toBeNull();
    expect(calcularReceta("grano", -1)).toBeNull();
    expect(calcularReceta("pellets", NaN)).toBeNull();
    expect(calcularReceta("grano", Infinity)).toBeNull();
  });
});

describe("parseDecimal", () => {
  it("acepta coma o punto decimal", () => {
    expect(parseDecimal("2,5")).toBe(2.5);
    expect(parseDecimal(" 3.25 ")).toBe(3.25);
  });

  it("devuelve NaN con texto vacio o invalido", () => {
    expect(parseDecimal("")).toBeNaN();
    expect(parseDecimal("   ")).toBeNaN();
    expect(parseDecimal("abc")).toBeNaN();
  });
});

describe("resumenReceta", () => {
  it("calcula el total humedo y la tasa de inoculacion de la receta de base", () => {
    const r = resumenReceta(RECETA_BASE);
    expect(r.totalHumedoKg).toBeCloseTo(65.96, 2);
    expect(r.tasaInoculacionPct).toBeCloseTo(4.12, 2);
  });
});
