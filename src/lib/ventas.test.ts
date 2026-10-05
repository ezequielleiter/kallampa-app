import { describe, it, expect } from "vitest";
import { totalVenta, stockLote, resumenComercialLote, formatKgEsAR } from "./ventas";

describe("totalVenta", () => {
  it("suma kg × precioPorKg de cada item", () => {
    expect(totalVenta([{ kg: 2, precioPorKg: 8000 }, { kg: 0.5, precioPorKg: 7000 }])).toBe(19500);
  });
  it("sin items es 0", () => {
    expect(totalVenta([])).toBe(0);
  });
});

describe("stockLote", () => {
  it("disponible = cosechado − vendido − merma", () => {
    expect(stockLote({ cosechadoKg: 3, vendidoKg: 2, mermaKg: 0.5 })).toEqual({
      cosechadoKg: 3,
      vendidoKg: 2,
      mermaKg: 0.5,
      disponibleKg: 0.5,
    });
  });
  it("redondea el ruido de float", () => {
    expect(stockLote({ cosechadoKg: 0.3, vendidoKg: 0.1, mermaKg: 0.2 }).disponibleKg).toBe(0);
    expect(stockLote({ cosechadoKg: 0.1 + 0.2, vendidoKg: 0, mermaKg: 0 }).cosechadoKg).toBe(0.3);
  });
});

describe("resumenComercialLote", () => {
  it("margen positivo y precio promedio", () => {
    const r = resumenComercialLote({
      cosechadoKg: 3,
      vendidoKg: 2,
      mermaKg: 0,
      ingresos: 16000,
      costoTotal: 7200,
    });
    expect(r).toEqual({
      cosechadoKg: 3,
      vendidoKg: 2,
      mermaKg: 0,
      disponibleKg: 1,
      ingresos: 16000,
      margen: 8800,
      precioPromedioKg: 8000,
    });
  });
  it("margen negativo si los ingresos no cubren el costo", () => {
    const r = resumenComercialLote({
      cosechadoKg: 3,
      vendidoKg: 1,
      mermaKg: 0,
      ingresos: 1000,
      costoTotal: 7000,
    });
    expect(r.margen).toBe(-6000);
  });
  it("sin ventas: precio promedio null y margen = −costo", () => {
    const r = resumenComercialLote({
      cosechadoKg: 3,
      vendidoKg: 0,
      mermaKg: 0,
      ingresos: 0,
      costoTotal: 7000,
    });
    expect(r.precioPromedioKg).toBeNull();
    expect(r.margen).toBe(-7000);
  });
});

describe("formatKgEsAR", () => {
  it("usa coma decimal y hasta 2 decimales", () => {
    expect(formatKgEsAR(3.256)).toBe("3,26");
    expect(formatKgEsAR(1)).toBe("1");
  });
});
