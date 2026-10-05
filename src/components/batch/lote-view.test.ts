import { describe, it, expect } from "vitest";
import { trazabilidadLote } from "./lote-view";
import type { BatchDetail, Jar, Recipiente } from "@/lib/types";

function jar(numero: string, estado: Jar["estado"]): Jar {
  return { _id: `jar-${numero}`, batchId: "b1", numeroGuia: `L-2026-001-${numero}`, estado };
}

function recipiente(id: string, overrides: Partial<Recipiente> = {}): Recipiente {
  return {
    _id: `rec-${id}`,
    batchId: "b1",
    numeroSeguimiento: `L-2026-001-${id}`,
    origenFrascoIds: [],
    tipoSustratoId: "sus-1",
    pesoSustratoKg: 5,
    precioPorKg: 100,
    fechaInicioIncubacion: "2026-09-10T00:00:00.000Z",
    diasEsperadosIncubacion: 20,
    estado: "incubando",
    oleadas: [],
    ...overrides,
  };
}

function batch(overrides: Partial<BatchDetail> = {}): BatchDetail {
  return {
    _id: "b1",
    numeroLote: "L-2026-001",
    fungusTypeId: { _id: "f1", nombre: "Gírgola" } as BatchDetail["fungusTypeId"],
    inoculacionGrano: {
      tipoGranoId: "g1",
      pesoGranoKg: 10,
      precioPorKg: 600,
      cantidadFrascos: 3,
      fechaInicio: "2026-09-07T00:00:00.000Z",
      diasEsperados: 21,
    },
    jars: [jar("F01", "colonizado"), jar("F02", "contaminado"), jar("F03", "colonizado")],
    recipientes: [],
    comercial: {
      cosechadoKg: 0,
      vendidoKg: 0,
      mermaKg: 0,
      disponibleKg: 0,
      ingresos: 0,
      margen: 0,
      precioPromedioKg: null,
    },
    ...overrides,
  };
}

describe("trazabilidadLote", () => {
  it("sin recipientes: incubación, fructificación y cosecha quedan pendientes", () => {
    const t = trazabilidadLote(batch());
    expect(t.etapas).toEqual({
      origen: "done",
      inoculacion: "done",
      incubacion: "pending",
      fructificacion: "pending",
      cosecha: "pending",
    });
    expect(t.completas).toBe(2);
    expect(t.contaminados).toBe(1);
    expect(t.pesoTotal).toBe(0);
  });

  it("recipientes incubando: incubación en curso, ordenados por fecha", () => {
    const t = trazabilidadLote(
      batch({
        recipientes: [
          recipiente("R02", { fechaInicioIncubacion: "2026-09-12T00:00:00.000Z" }),
          recipiente("R01", { fechaInicioIncubacion: "2026-09-09T00:00:00.000Z" }),
        ],
      })
    );
    expect(t.etapas.incubacion).toBe("active");
    expect(t.etapas.fructificacion).toBe("pending");
    expect(t.incubacion.map((r) => r.numeroSeguimiento)).toEqual(["L-2026-001-R01", "L-2026-001-R02"]);
  });

  it("junta las oleadas de todos los recipientes por fecha y suma el total", () => {
    const t = trazabilidadLote(
      batch({
        recipientes: [
          recipiente("R01", {
            estado: "finalizado",
            fechaInicioFructificacion: "2026-09-25T00:00:00.000Z",
            oleadas: [
              { _id: "o1", fecha: "2026-10-01T00:00:00.000Z", pesoKg: 1.5 },
              { _id: "o3", fecha: "2026-10-15T00:00:00.000Z", pesoKg: 0.5 },
            ],
          }),
          recipiente("R02", {
            estado: "fructificando",
            fechaInicioFructificacion: "2026-09-28T00:00:00.000Z",
            oleadas: [{ _id: "o2", fecha: "2026-10-05T00:00:00.000Z", pesoKg: 2 }],
          }),
        ],
      })
    );
    expect(t.oleadas.map((x) => x.oleada._id)).toEqual(["o1", "o2", "o3"]);
    expect(t.pesoTotal).toBe(4);
    expect(t.fructificacion).toHaveLength(2);
    expect(t.etapas.fructificacion).toBe("active");
    expect(t.etapas.cosecha).toBe("active");
  });

  it("origen: poblado vs. ausente", () => {
    expect(trazabilidadLote(batch()).origen).toBeNull();
    expect(trazabilidadLote(batch({ origenFrascoLiquidoId: "fl1" })).origen).toBeNull();
    expect(
      trazabilidadLote(batch({ origenFrascoLiquidoId: { _id: "fl1", numeroGuia: "FL-001" } })).origen
    ).toEqual({ _id: "fl1", numeroGuia: "FL-001" });
  });

  it("lote terminado: todas las etapas completas", () => {
    const t = trazabilidadLote(
      batch({
        jars: [jar("F01", "usado")],
        recipientes: [
          recipiente("R01", {
            estado: "finalizado",
            fechaInicioFructificacion: "2026-09-25T00:00:00.000Z",
            oleadas: [{ _id: "o1", fecha: "2026-10-01T00:00:00.000Z", pesoKg: 1 }],
          }),
        ],
      })
    );
    expect(t.completas).toBe(5);
  });
});
