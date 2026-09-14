import { describe, it, expect } from "vitest";
import { differenceInCalendarDays, subDays } from "date-fns";
import {
  diasEnEtapa,
  diasTotalesLote,
  diasPorEtapa,
  pesoTotalCosechado,
  eficienciaBiologica,
  rendimientoPorOleada,
  costoProduccion,
  alertaEtapaActual,
  resumenLote,
  agregarPorCatalogo,
  type LeanBatch,
} from "./metrics";

const HOY = new Date();

function haceDias(n: number): Date {
  return subDays(HOY, n);
}

/** Batch minimo valido: recien creado, solo con inoculacionGrano. */
function batchBase(overrides: Partial<LeanBatch> = {}): LeanBatch {
  return {
    numeroLote: "L-2026-001",
    fungusTypeId: "fungus-1",
    estado: "inoculacion_grano",
    descartado: false,
    inoculacionGrano: {
      tipoGranoId: "grain-1",
      pesoGranoKg: 10,
      precioPorKg: 500,
      cantidadFrascos: 3,
      fechaInicio: haceDias(20),
      diasEsperados: 14,
    },
    oleadas: [],
    historialEstados: [{ estado: "inoculacion_grano", fecha: haceDias(20) }],
    ...overrides,
  };
}

describe("diasEnEtapa", () => {
  it("caso normal: calcula la diferencia entre fechaInicio y fechaFin", () => {
    const inicio = haceDias(10);
    const fin = haceDias(3);
    expect(diasEnEtapa(inicio, fin)).toBe(differenceInCalendarDays(fin, inicio));
    expect(diasEnEtapa(inicio, fin)).toBe(7);
  });

  it("sin fechaFin: usa hoy", () => {
    const inicio = haceDias(5);
    expect(diasEnEtapa(inicio)).toBe(5);
  });

  it("fechaInicio undefined: da null", () => {
    expect(diasEnEtapa(undefined)).toBeNull();
  });
});

describe("diasTotalesLote", () => {
  it("lote completo: inoculacion -> cosecha.fechaFin", () => {
    const batch = batchBase({
      inoculacionGrano: {
        tipoGranoId: "g1",
        pesoGranoKg: 10,
        precioPorKg: 500,
        cantidadFrascos: 3,
        fechaInicio: haceDias(60),
        diasEsperados: 14,
      },
      cosecha: { fechaInicio: haceDias(10), fechaFin: haceDias(2) },
    });
    expect(diasTotalesLote(batch)).toBe(58);
  });

  it("sin cosecha.fechaFin pero con historialEstados finalizado/descartado: usa esa fecha", () => {
    const batch = batchBase({
      inoculacionGrano: {
        tipoGranoId: "g1",
        pesoGranoKg: 10,
        precioPorKg: 500,
        cantidadFrascos: 3,
        fechaInicio: haceDias(60),
        diasEsperados: 14,
      },
      estado: "descartado",
      historialEstados: [
        { estado: "inoculacion_grano", fecha: haceDias(60) },
        { estado: "descartado", fecha: haceDias(40) },
      ],
    });
    expect(diasTotalesLote(batch)).toBe(20);
  });

  it("lote activo sin fechaFin ni historial de cierre: usa hoy", () => {
    const batch = batchBase({
      inoculacionGrano: {
        tipoGranoId: "g1",
        pesoGranoKg: 10,
        precioPorKg: 500,
        cantidadFrascos: 3,
        fechaInicio: haceDias(7),
        diasEsperados: 14,
      },
    });
    expect(diasTotalesLote(batch)).toBe(7);
  });

  it("sin inoculacionGrano.fechaInicio: da null", () => {
    const batch = batchBase({
      inoculacionGrano: {
        tipoGranoId: "g1",
        pesoGranoKg: 10,
        precioPorKg: 500,
        cantidadFrascos: 3,
        fechaInicio: undefined as unknown as Date,
        diasEsperados: 14,
      },
    });
    expect(diasTotalesLote(batch)).toBeNull();
  });
});

describe("diasPorEtapa", () => {
  it("lote recien creado: solo inoculacionGrano tiene valor, el resto es null", () => {
    const batch = batchBase();
    const resultado = diasPorEtapa(batch);
    expect(resultado.inoculacionGrano).toBe(20);
    expect(resultado.crecimientoSustrato).toBeNull();
    expect(resultado.fructificacion).toBeNull();
    expect(resultado.cosecha).toBeNull();
  });

  it("etapas alcanzadas devuelven sus dias correspondientes", () => {
    const batch = batchBase({
      crecimientoSustrato: { fechaInicio: haceDias(15), fechaFin: haceDias(5) },
      fructificacion: { fechaInicio: haceDias(5) },
    });
    const resultado = diasPorEtapa(batch);
    expect(resultado.crecimientoSustrato).toBe(10);
    expect(resultado.fructificacion).toBe(5);
    expect(resultado.cosecha).toBeNull();
  });
});

describe("pesoTotalCosechado", () => {
  it("suma correctamente el pesoKg de todas las oleadas", () => {
    const batch = batchBase({
      oleadas: [
        { numero: 1, fecha: haceDias(3), pesoKg: 2.5 },
        { numero: 2, fecha: haceDias(1), pesoKg: 3.5 },
      ],
    });
    expect(pesoTotalCosechado(batch)).toBe(6);
  });

  it("oleadas vacio: da 0 sin error", () => {
    const batch = batchBase({ oleadas: [] });
    expect(pesoTotalCosechado(batch)).toBe(0);
  });
});

describe("eficienciaBiologica", () => {
  it("calculo normal: pesoTotalCosechado / kilosSustrato * 100", () => {
    const batch = batchBase({
      crecimientoSustrato: { kilosSustrato: 20 },
      oleadas: [{ numero: 1, fecha: haceDias(1), pesoKg: 6 }],
    });
    expect(eficienciaBiologica(batch)).toBe(30);
  });

  it("sin crecimientoSustrato: da null", () => {
    const batch = batchBase({
      oleadas: [{ numero: 1, fecha: haceDias(1), pesoKg: 6 }],
    });
    expect(eficienciaBiologica(batch)).toBeNull();
  });

  it("kilosSustrato: 0: da null (no Infinity ni NaN)", () => {
    const batch = batchBase({
      crecimientoSustrato: { kilosSustrato: 0 },
      oleadas: [{ numero: 1, fecha: haceDias(1), pesoKg: 6 }],
    });
    const resultado = eficienciaBiologica(batch);
    expect(resultado).toBeNull();
    expect(resultado).not.toBe(Infinity);
    expect(Number.isNaN(resultado)).toBe(false);
  });
});

describe("rendimientoPorOleada", () => {
  it("los porcentajes suman ~100%", () => {
    const batch = batchBase({
      oleadas: [
        { numero: 1, fecha: haceDias(3), pesoKg: 3 },
        { numero: 2, fecha: haceDias(2), pesoKg: 5 },
        { numero: 3, fecha: haceDias(1), pesoKg: 2 },
      ],
    });
    const resultado = rendimientoPorOleada(batch);
    expect(resultado).toHaveLength(3);
    const sumaPorcentajes = resultado.reduce((a, r) => a + r.porcentajeDelTotal, 0);
    expect(sumaPorcentajes).toBeCloseTo(100, 6);
    expect(resultado[0].porcentajeDelTotal).toBeCloseTo(30, 6);
    expect(resultado[1].porcentajeDelTotal).toBeCloseTo(50, 6);
    expect(resultado[2].porcentajeDelTotal).toBeCloseTo(20, 6);
  });

  it("sin oleadas: array vacio, sin error", () => {
    const batch = batchBase({ oleadas: [] });
    expect(rendimientoPorOleada(batch)).toEqual([]);
  });
});

describe("costoProduccion", () => {
  it("calculo normal", () => {
    const batch = batchBase({
      inoculacionGrano: {
        tipoGranoId: "g1",
        pesoGranoKg: 10,
        precioPorKg: 500,
        cantidadFrascos: 3,
        fechaInicio: haceDias(60),
        diasEsperados: 14,
      },
      crecimientoSustrato: { kilosSustrato: 20, precioPorKg: 100 },
      oleadas: [{ numero: 1, fecha: haceDias(1), pesoKg: 7 }],
    });
    const resultado = costoProduccion(batch);
    expect(resultado.costoGrano).toBe(5000);
    expect(resultado.costoSustrato).toBe(2000);
    expect(resultado.costoTotal).toBe(7000);
    expect(resultado.costoPorKgProducido).toBeCloseTo(1000, 6);
  });

  it("lote todavia sin cosecha (oleadas vacias): costoPorKgProducido null, no division por cero", () => {
    const batch = batchBase({
      crecimientoSustrato: { kilosSustrato: 20, precioPorKg: 100 },
      oleadas: [],
    });
    const resultado = costoProduccion(batch);
    expect(resultado.costoPorKgProducido).toBeNull();
    expect(Number.isNaN(resultado.costoPorKgProducido as unknown as number)).toBe(false);
  });

  it("sin crecimientoSustrato todavia: costoSustrato es 0, no NaN", () => {
    const batch = batchBase();
    const resultado = costoProduccion(batch);
    expect(resultado.costoSustrato).toBe(0);
    expect(Number.isNaN(resultado.costoSustrato)).toBe(false);
    expect(resultado.costoTotal).toBe(resultado.costoGrano);
  });
});

describe("alertaEtapaActual", () => {
  it("caso demorado: diasTranscurridos > diasEsperados", () => {
    const batch = batchBase({
      inoculacionGrano: {
        tipoGranoId: "g1",
        pesoGranoKg: 10,
        precioPorKg: 500,
        cantidadFrascos: 3,
        fechaInicio: haceDias(20),
        diasEsperados: 14,
      },
    });
    const resultado = alertaEtapaActual(batch);
    expect(resultado.demorado).toBe(true);
    expect(resultado.diasTranscurridos).toBe(20);
    expect(resultado.diasEsperados).toBe(14);
    expect(resultado.diasDeDemora).toBe(6);
  });

  it("caso a tiempo: no demorado", () => {
    const batch = batchBase({
      inoculacionGrano: {
        tipoGranoId: "g1",
        pesoGranoKg: 10,
        precioPorKg: 500,
        cantidadFrascos: 3,
        fechaInicio: haceDias(5),
        diasEsperados: 14,
      },
    });
    const resultado = alertaEtapaActual(batch);
    expect(resultado.demorado).toBe(false);
    expect(resultado.diasDeDemora).toBe(0);
  });

  it("estado 'finalizado': siempre demorado false", () => {
    const batch = batchBase({ estado: "finalizado" });
    expect(alertaEtapaActual(batch)).toEqual({
      demorado: false,
      diasTranscurridos: 0,
      diasEsperados: 0,
      diasDeDemora: 0,
    });
  });

  it("estado 'descartado': siempre demorado false", () => {
    const batch = batchBase({ estado: "descartado" });
    expect(alertaEtapaActual(batch)).toEqual({
      demorado: false,
      diasTranscurridos: 0,
      diasEsperados: 0,
      diasDeDemora: 0,
    });
  });
});

describe("resumenLote", () => {
  it("combina todas las metricas correctamente (delega en las funciones individuales)", () => {
    const batch = batchBase({
      numeroLote: "L-2026-042",
      estado: "finalizado",
      crecimientoSustrato: { kilosSustrato: 20, precioPorKg: 100 },
      cosecha: { fechaInicio: haceDias(10), fechaFin: haceDias(1) },
      oleadas: [
        { numero: 1, fecha: haceDias(5), pesoKg: 4 },
        { numero: 2, fecha: haceDias(2), pesoKg: 2 },
      ],
    });

    const resumen = resumenLote(batch);

    expect(resumen.numeroLote).toBe("L-2026-042");
    expect(resumen.estado).toBe("finalizado");
    expect(resumen.pesoTotalCosechado).toBe(pesoTotalCosechado(batch));
    expect(resumen.eficienciaBiologica).toBe(eficienciaBiologica(batch));
    expect(resumen.diasTotales).toBe(diasTotalesLote(batch));
    expect(resumen.diasPorEtapa).toEqual(diasPorEtapa(batch));
    expect(resumen.rendimientoPorOleada).toEqual(rendimientoPorOleada(batch));
    expect(resumen.costoProduccion).toEqual(costoProduccion(batch));
    // finalizado siempre alerta "no demorado"
    expect(resumen.alertaEtapaActual.demorado).toBe(false);
  });
});

describe("agregarPorCatalogo", () => {
  // Simula un ObjectId real de mongoose: expone toHexString() y NO tiene
  // `nombre` (a diferencia de un documento poblado). El bug real que esto
  // cubre: un getter `_id` en mongoose.Types.ObjectId que devuelve el mismo
  // ObjectId causaba recursion infinita / stack overflow al intentar
  // distinguir "ObjectId crudo" de "documento populado".
  function fakeObjectId(hex: string) {
    return {
      _bsontype: "ObjectId",
      toHexString: () => hex,
      // El getter problematico: se devuelve a si mismo, igual que hace
      // mongoose.Types.ObjectId de verdad (para interoperar con populate).
      get _id(): unknown {
        return this;
      },
      toString: () => hex,
    };
  }

  function populatedFungus(id: string, nombre: string) {
    // Forma que deja .populate().lean(): objeto plano con su propio _id.
    return { _id: id, nombre };
  }

  it("no explota (ni recursiona infinito) con un id sin poblar tipo ObjectId real", () => {
    const batch = batchBase({
      estado: "finalizado",
      fungusTypeId: fakeObjectId("507f1f77bcf86cd799439011"),
      crecimientoSustrato: { kilosSustrato: 20, precioPorKg: 100 },
      oleadas: [{ numero: 1, fecha: haceDias(1), pesoKg: 5 }],
    });

    let resultado: ReturnType<typeof agregarPorCatalogo> = [];
    expect(() => {
      resultado = agregarPorCatalogo([batch], "fungusTypeId");
    }).not.toThrow();

    expect(resultado).toHaveLength(1);
    expect(resultado[0].key).toBe("507f1f77bcf86cd799439011");
    // Sin nombre poblado, el label cae al fallback (el key/hex string).
    expect(resultado[0].label).toBe("507f1f77bcf86cd799439011");
  });

  it("con campo poblado (objeto plano {_id, nombre}) usa el nombre como label", () => {
    const batch = batchBase({
      estado: "finalizado",
      fungusTypeId: populatedFungus("507f1f77bcf86cd799439011", "Gírgola"),
      crecimientoSustrato: { kilosSustrato: 20, precioPorKg: 100 },
      oleadas: [{ numero: 1, fecha: haceDias(1), pesoKg: 5 }],
    });

    const resultado = agregarPorCatalogo([batch], "fungusTypeId");
    expect(resultado).toHaveLength(1);
    expect(resultado[0].key).toBe("507f1f77bcf86cd799439011");
    expect(resultado[0].label).toBe("Gírgola");
    expect(resultado[0].cantidadLotes).toBe(1);
  });

  it("solo agrupa lotes con estado 'finalizado' (cosecha/descartado con el mismo hongo no cuentan)", () => {
    const fungus = populatedFungus("f1", "Gírgola");
    const finalizado = batchBase({
      estado: "finalizado",
      fungusTypeId: fungus,
      crecimientoSustrato: { kilosSustrato: 10, precioPorKg: 50 },
      oleadas: [{ numero: 1, fecha: haceDias(1), pesoKg: 5 }],
    });
    const enCosecha = batchBase({
      estado: "cosecha",
      fungusTypeId: fungus,
      crecimientoSustrato: { kilosSustrato: 10, precioPorKg: 50 },
      oleadas: [{ numero: 1, fecha: haceDias(1), pesoKg: 100 }],
    });
    const descartado = batchBase({
      estado: "descartado",
      fungusTypeId: fungus,
      crecimientoSustrato: { kilosSustrato: 10, precioPorKg: 50 },
      oleadas: [{ numero: 1, fecha: haceDias(1), pesoKg: 999 }],
    });

    const resultado = agregarPorCatalogo(
      [finalizado, enCosecha, descartado],
      "fungusTypeId"
    );

    expect(resultado).toHaveLength(1);
    expect(resultado[0].cantidadLotes).toBe(1);
    // Si estuviera incluyendo los otros lotes, la EB promedio no seria 50.
    expect(resultado[0].eficienciaBiologicaPromedio).toBe(50);
  });

  it("los promedios ignoran valores null (ej. lotes finalizados sin crecimientoSustrato)", () => {
    const fungus = populatedFungus("f1", "Gírgola");
    const conDatos = batchBase({
      estado: "finalizado",
      fungusTypeId: fungus,
      crecimientoSustrato: { kilosSustrato: 10, precioPorKg: 50 },
      oleadas: [{ numero: 1, fecha: haceDias(1), pesoKg: 5 }],
    });
    // Finalizado pero sin crecimientoSustrato: eficienciaBiologica da null,
    // no deberia arruinar el promedio del grupo.
    const sinSustrato = batchBase({
      estado: "finalizado",
      fungusTypeId: fungus,
    });

    const resultado = agregarPorCatalogo([conDatos, sinSustrato], "fungusTypeId");

    expect(resultado).toHaveLength(1);
    expect(resultado[0].cantidadLotes).toBe(2);
    // Promedio de EB debe ser 50 (solo el valor no-null), no NaN ni la mitad.
    expect(resultado[0].eficienciaBiologicaPromedio).toBe(50);
  });
});
