import { describe, it, expect } from "vitest";
import { differenceInCalendarDays, subDays } from "date-fns";
import {
  diasEnEtapa,
  estadoLote,
  alertaFrasco,
  alertaRecipiente,
  pesoCosechadoRecipiente,
  eficienciaBiologicaRecipiente,
  costoRecipiente,
  resumenLote,
  agregarPorCatalogo,
  type LeanBatch,
  type LeanJar,
  type LeanRecipiente,
  type LoteConDatos,
} from "./metrics";

const HOY = new Date();

function haceDias(n: number): Date {
  return subDays(HOY, n);
}

function batchBase(overrides: Partial<LeanBatch> = {}): LeanBatch {
  return {
    numeroLote: "L-2026-001",
    fungusTypeId: "fungus-1",
    inoculacionGrano: {
      tipoGranoId: "grain-1",
      pesoGranoKg: 10,
      precioPorKg: 500,
      cantidadFrascos: 3,
      fechaInicio: haceDias(20),
      diasEsperados: 14,
    },
    ...overrides,
  };
}

function jar(overrides: Partial<LeanJar> = {}): LeanJar {
  return { numeroGuia: "L-2026-001-F01", estado: "colonizando", ...overrides };
}

function recipiente(overrides: Partial<LeanRecipiente> = {}): LeanRecipiente {
  return {
    numeroSeguimiento: "L-2026-001-R01",
    tipoSustratoId: "sustrato-1",
    pesoSustratoKg: 20,
    precioPorKg: 100,
    fechaInicioIncubacion: haceDias(15),
    diasEsperadosIncubacion: 20,
    estado: "incubando",
    oleadas: [],
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
    expect(diasEnEtapa(haceDias(5))).toBe(5);
  });

  it("fechaInicio undefined: da null", () => {
    expect(diasEnEtapa(undefined)).toBeNull();
  });
});

describe("estadoLote", () => {
  it("sin recipientes: siempre 'en_progreso' (aunque los frascos ya se usaron)", () => {
    expect(estadoLote([jar({ estado: "usado" })], [])).toBe("en_progreso");
  });

  it("con un frasco colonizando: 'en_progreso'", () => {
    expect(estadoLote([jar({ estado: "colonizando" })], [])).toBe("en_progreso");
  });

  it("con un recipiente incubando: 'en_progreso'", () => {
    expect(estadoLote([jar({ estado: "usado" })], [recipiente({ estado: "incubando" })])).toBe(
      "en_progreso"
    );
  });

  it("con un recipiente fructificando: 'en_progreso'", () => {
    expect(estadoLote([jar({ estado: "usado" })], [recipiente({ estado: "fructificando" })])).toBe(
      "en_progreso"
    );
  });

  it("todos los frascos usados y todos los recipientes finalizados/contaminados/descartados: 'finalizado'", () => {
    const estado = estadoLote(
      [jar({ estado: "usado" }), jar({ estado: "contaminado" })],
      [recipiente({ estado: "finalizado" }), recipiente({ estado: "contaminado" })]
    );
    expect(estado).toBe("finalizado");
  });
});

describe("alertaFrasco", () => {
  it("colonizando y demorado: true", () => {
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
    expect(alertaFrasco(batch, jar({ estado: "colonizando" }))).toBe(true);
  });

  it("colonizando pero a tiempo: false", () => {
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
    expect(alertaFrasco(batch, jar({ estado: "colonizando" }))).toBe(false);
  });

  it("no colonizando (ya usado/contaminado/colonizado): siempre false, sin importar la demora", () => {
    const batch = batchBase({
      inoculacionGrano: {
        tipoGranoId: "g1",
        pesoGranoKg: 10,
        precioPorKg: 500,
        cantidadFrascos: 3,
        fechaInicio: haceDias(99),
        diasEsperados: 14,
      },
    });
    expect(alertaFrasco(batch, jar({ estado: "usado" }))).toBe(false);
    expect(alertaFrasco(batch, jar({ estado: "colonizado" }))).toBe(false);
  });
});

describe("alertaRecipiente", () => {
  it("incubando y demorado: true", () => {
    expect(
      alertaRecipiente(
        recipiente({ estado: "incubando", fechaInicioIncubacion: haceDias(30), diasEsperadosIncubacion: 20 })
      )
    ).toBe(true);
  });

  it("incubando a tiempo: false", () => {
    expect(
      alertaRecipiente(
        recipiente({ estado: "incubando", fechaInicioIncubacion: haceDias(5), diasEsperadosIncubacion: 20 })
      )
    ).toBe(false);
  });

  it("fructificando y demorado: true", () => {
    expect(
      alertaRecipiente(
        recipiente({
          estado: "fructificando",
          fechaInicioFructificacion: haceDias(15),
          diasEsperadosFructificacion: 10,
        })
      )
    ).toBe(true);
  });

  it("estado terminal (finalizado/contaminado/descartado): siempre false", () => {
    expect(alertaRecipiente(recipiente({ estado: "finalizado", fechaInicioIncubacion: haceDias(99) }))).toBe(
      false
    );
    expect(alertaRecipiente(recipiente({ estado: "contaminado", fechaInicioIncubacion: haceDias(99) }))).toBe(
      false
    );
    expect(alertaRecipiente(recipiente({ estado: "descartado", fechaInicioIncubacion: haceDias(99) }))).toBe(
      false
    );
  });
});

describe("pesoCosechadoRecipiente / eficienciaBiologicaRecipiente / costoRecipiente", () => {
  it("suma las oleadas y calcula EB / costo correctamente", () => {
    const r = recipiente({
      pesoSustratoKg: 20,
      precioPorKg: 100,
      oleadas: [
        { fecha: haceDias(3), pesoKg: 2.5 },
        { fecha: haceDias(1), pesoKg: 3.5 },
      ],
    });
    expect(pesoCosechadoRecipiente(r)).toBe(6);
    expect(eficienciaBiologicaRecipiente(r)).toBe(30);
    expect(costoRecipiente(r)).toBe(2000);
  });

  it("sin oleadas: peso 0, EB 0 (no null, hay sustrato)", () => {
    const r = recipiente({ pesoSustratoKg: 20, oleadas: [] });
    expect(pesoCosechadoRecipiente(r)).toBe(0);
    expect(eficienciaBiologicaRecipiente(r)).toBe(0);
  });

  it("pesoSustratoKg 0: EB null (no Infinity ni NaN)", () => {
    const r = recipiente({ pesoSustratoKg: 0, oleadas: [{ fecha: haceDias(1), pesoKg: 5 }] });
    const resultado = eficienciaBiologicaRecipiente(r);
    expect(resultado).toBeNull();
    expect(resultado).not.toBe(Infinity);
  });
});

describe("resumenLote", () => {
  it("lote sin recipientes: en_progreso, pesos/costos en 0/null segun corresponda", () => {
    const batch = batchBase();
    const resumen = resumenLote(batch, [jar()], []);
    expect(resumen.estadoDerivado).toBe("en_progreso");
    expect(resumen.pesoTotalCosechado).toBe(0);
    expect(resumen.eficienciaBiologica).toBeNull();
    expect(resumen.costoProduccion.costoSustrato).toBe(0);
    expect(resumen.costoProduccion.costoTotal).toBe(resumen.costoProduccion.costoGrano);
    expect(resumen.costoProduccion.costoPorKgProducido).toBeNull();
  });

  it("combina el costo de grano del batch + sustrato de todos los recipientes", () => {
    const batch = batchBase({
      inoculacionGrano: {
        tipoGranoId: "g1",
        pesoGranoKg: 10,
        precioPorKg: 500,
        cantidadFrascos: 3,
        fechaInicio: haceDias(60),
        diasEsperados: 14,
      },
    });
    const recipientes = [
      recipiente({ pesoSustratoKg: 20, precioPorKg: 100, oleadas: [{ fecha: haceDias(1), pesoKg: 4 }] }),
      recipiente({ pesoSustratoKg: 10, precioPorKg: 50, oleadas: [{ fecha: haceDias(2), pesoKg: 2 }] }),
    ];
    const resumen = resumenLote(batch, [], recipientes);

    expect(resumen.pesoTotalCosechado).toBe(6);
    expect(resumen.costoProduccion.costoGrano).toBe(5000);
    expect(resumen.costoProduccion.costoSustrato).toBe(2000 + 500);
    expect(resumen.costoProduccion.costoTotal).toBe(5000 + 2000 + 500);
    expect(resumen.eficienciaBiologica).toBeCloseTo((6 / 30) * 100, 6);
  });

  it("cuenta alertas de frascos + recipientes demorados", () => {
    const batch = batchBase({
      inoculacionGrano: {
        tipoGranoId: "g1",
        pesoGranoKg: 10,
        precioPorKg: 500,
        cantidadFrascos: 3,
        fechaInicio: haceDias(30),
        diasEsperados: 14,
      },
    });
    const frascos = [jar({ estado: "colonizando" }), jar({ estado: "usado" })];
    const recipientes = [
      recipiente({ estado: "incubando", fechaInicioIncubacion: haceDias(40), diasEsperadosIncubacion: 20 }),
      recipiente({ estado: "finalizado", fechaInicioIncubacion: haceDias(40), diasEsperadosIncubacion: 20 }),
    ];
    const resumen = resumenLote(batch, frascos, recipientes);
    expect(resumen.alertas).toBe(2);
  });

  it("diasTotales de un lote finalizado: hasta la ultima oleada entre TODOS los recipientes", () => {
    const batch = batchBase({
      inoculacionGrano: {
        tipoGranoId: "g1",
        pesoGranoKg: 10,
        precioPorKg: 500,
        cantidadFrascos: 3,
        fechaInicio: haceDias(60),
        diasEsperados: 14,
      },
    });
    const recipientes = [
      recipiente({
        estado: "finalizado",
        oleadas: [{ fecha: haceDias(10), pesoKg: 2 }],
      }),
      recipiente({
        estado: "finalizado",
        oleadas: [{ fecha: haceDias(2), pesoKg: 2 }],
      }),
    ];
    expect(resumenLote(batch, [], recipientes).diasTotales).toBe(58);
  });
});

describe("agregarPorCatalogo", () => {
  function fakeObjectId(hex: string) {
    return {
      _bsontype: "ObjectId",
      toHexString: () => hex,
      get _id(): unknown {
        return this;
      },
      toString: () => hex,
    };
  }

  function populated(id: string, nombre: string) {
    return { _id: id, nombre };
  }

  it("por hongo/grano: solo agrupa lotes con estadoDerivado 'finalizado', no explota con ObjectId sin poblar", () => {
    const batch = batchBase({
      fungusTypeId: fakeObjectId("507f1f77bcf86cd799439011"),
    });
    const lote: LoteConDatos = {
      batch,
      frascos: [],
      recipientes: [
        recipiente({
          estado: "finalizado",
          pesoSustratoKg: 20,
          oleadas: [{ fecha: haceDias(1), pesoKg: 5 }],
        }),
      ],
    };

    let resultado: ReturnType<typeof agregarPorCatalogo> = [];
    expect(() => {
      resultado = agregarPorCatalogo("fungusTypeId", [lote], []);
    }).not.toThrow();

    expect(resultado).toHaveLength(1);
    expect(resultado[0].key).toBe("507f1f77bcf86cd799439011");
    expect(resultado[0].cantidadLotes).toBe(1);
  });

  it("por hongo: ignora lotes 'en_progreso' con el mismo hongo", () => {
    const fungus = populated("f1", "Girgola");
    const finalizado: LoteConDatos = {
      batch: batchBase({ fungusTypeId: fungus }),
      frascos: [],
      recipientes: [
        recipiente({ estado: "finalizado", pesoSustratoKg: 10, oleadas: [{ fecha: haceDias(1), pesoKg: 5 }] }),
      ],
    };
    const enProgreso: LoteConDatos = {
      batch: batchBase({ fungusTypeId: fungus }),
      frascos: [jar({ estado: "colonizando" })],
      recipientes: [],
    };

    const resultado = agregarPorCatalogo("fungusTypeId", [finalizado, enProgreso], []);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].cantidadLotes).toBe(1);
    expect(resultado[0].label).toBe("Girgola");
  });

  it("por sustrato: agrupa RECIPIENTES finalizados a nivel individual, cruzando lotes", () => {
    const sustrato = populated("s1", "Aserrin");
    const recipientes = [
      recipiente({ estado: "finalizado", tipoSustratoId: sustrato, pesoSustratoKg: 10, oleadas: [{ fecha: haceDias(1), pesoKg: 5 }] }),
      recipiente({ estado: "finalizado", tipoSustratoId: sustrato, pesoSustratoKg: 10, oleadas: [{ fecha: haceDias(1), pesoKg: 3 }] }),
      recipiente({ estado: "incubando", tipoSustratoId: sustrato, pesoSustratoKg: 10 }),
    ];

    const resultado = agregarPorCatalogo("tipoSustratoId", [], recipientes);
    expect(resultado).toHaveLength(1);
    // Solo cuenta los 2 finalizados, no el que sigue incubando.
    expect(resultado[0].cantidadLotes).toBe(2);
    expect(resultado[0].label).toBe("Aserrin");
    expect(resultado[0].eficienciaBiologicaPromedio).toBeCloseTo((50 + 30) / 2, 6);
  });
});
