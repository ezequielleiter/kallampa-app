import { describe, it, expect } from "vitest";
import { parseFluxCsv } from "@/lib/influx";
import { computeCycles } from "./ciclos";
import { yDomain } from "./escalas";
import { fluxSerie, intervaloMuestreoSeg } from "./flux";
import type { SerieRow } from "./tipos";

const MIN = 60_000;
const T0 = Date.UTC(2026, 8, 25, 10, 0);

/** Serie de ventanas de 5 min a partir de pares [valor, onSeg]. */
function serie(pares: [number | null, number][], W = 5 * MIN): SerieRow[] {
  return pares.map(([valor, onSeg], i) => ({ t: T0 + i * W, valor, onSeg }));
}

describe("parseFluxCsv", () => {
  it("lee varios bloques con su propio encabezado, por nombre de columna", () => {
    const csv = [
      ",result,table,_time,calefaccion_seg,temperatura",
      ",_result,0,2026-09-25T10:00:00Z,45,21.3",
      ",_result,0,2026-09-25T10:05:00Z,0,",
      "",
      ",result,table,temperatura,_time,calefaccion_seg",
      ",_result,1,22.1,2026-09-25T10:10:00Z,120",
      "",
    ].join("\r\n");
    const rows = parseFluxCsv(csv);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ _time: "2026-09-25T10:00:00Z", calefaccion_seg: "45", temperatura: "21.3" });
    expect(rows[1].temperatura).toBeNull();
    expect(rows[2]).toMatchObject({ _time: "2026-09-25T10:10:00Z", temperatura: "22.1", calefaccion_seg: "120" });
  });

  it("devuelve vacio si solo hay encabezado", () => {
    expect(parseFluxCsv(",result,table,_time\n")).toEqual([]);
  });
});

describe("computeCycles", () => {
  it("calcula prendida, sube (con inercia), ritmo, se mantuvo y cae", () => {
    // ciclo 1: ventanas 0-1 prendidas; pico en la ventana 2 (inercia);
    // cae hasta la 6; ciclo 2 arranca en la 7 y sigue prendido al final.
    const rows = serie([
      [18, 120], // 10:00
      [19, 180], // 10:05
      [20, 0], //   10:10 pico
      [19.8, 0],
      [19.5, 0],
      [19.2, 0],
      [19, 0], //   10:30 ultima antes de volver a prender
      [18.9, 60], // 10:35 ciclo 2
    ]);
    const { ciclos, promedios } = computeCycles(rows, 300, T0 + 60 * MIN);
    expect(ciclos).toHaveLength(2);
    const [c2, c1] = ciclos; // del mas nuevo al mas viejo
    expect(c1.inicio).toBe(T0);
    expect(c1.prendidaSeg).toBe(300);
    expect(c1.subeDesde).toBe(18);
    expect(c1.subeHasta).toBe(20);
    expect(c1.ritmoPorMin).toBeCloseTo((19 - 18) / 5); // °C/min prendida
    // fin ultima prendida = 10:05 + 5 min = 10:10; proximo ciclo 10:35 → 25 min
    expect(c1.mantuvo).toEqual({ tipo: "hasta_proximo", seg: 25 * 60 });
    // pico 20 a las 10:10 → 19 a las 10:30: 1 °C en 20 min = 3 °C/h
    expect(c1.caePorHora).toBeCloseTo(3);
    expect(c2.mantuvo).toEqual({ tipo: "prendida_ahora" });
    expect(promedios.prendidaSeg).toBe(180);
    expect(promedios.mantuvoSeg).toBe(25 * 60);
  });

  it("marca 'en curso' si el ultimo ciclo ya se apago y no hubo otro", () => {
    const rows = serie([
      [18, 60],
      [18.5, 0],
      [18.4, 0],
    ]);
    const now = T0 + 20 * MIN;
    const [c] = computeCycles(rows, 300, now).ciclos;
    // fin de la ventana prendida: 10:05 → ahora 10:20 = 15 min
    expect(c.mantuvo).toEqual({ tipo: "en_curso", seg: 15 * 60 });
    // pico 18.5 a las 10:05 y ultima 10:10: menos de 15 min → sin caida
    expect(c.caePorHora).toBeNull();
  });

  it("una ventana faltante corta el ciclo y limita a 20 ciclos", () => {
    const rows: SerieRow[] = [];
    for (let i = 0; i < 50; i++) rows.push({ t: T0 + i * 10 * MIN, valor: 20, onSeg: i % 2 === 0 ? 30 : 0 });
    const { ciclos } = computeCycles(rows, 300);
    expect(ciclos).toHaveLength(20);
    expect(ciclos[0].inicio).toBeGreaterThan(ciclos[1].inicio);
  });

  it("tolera valores nulos del sensor", () => {
    const rows = serie([
      [null, 60],
      [null, 0],
    ]);
    const [c] = computeCycles(rows, 300).ciclos;
    expect(c.subeDesde).toBeNull();
    expect(c.ritmoPorMin).toBeNull();
    expect(c.caePorHora).toBeNull();
  });
});

describe("yDomain", () => {
  it("no arranca en 0 y usa un paso lindo con ~4 marcas", () => {
    const d = yDomain([20.1, 21.7, 22.4], [18, 24]);
    expect(d.min).toBeLessThanOrEqual(17.5);
    expect(d.max).toBeGreaterThanOrEqual(24.5);
    expect([0.2, 0.5, 1, 2, 5]).toContain(d.step);
    expect(d.ticks.length).toBeGreaterThanOrEqual(4);
    expect(d.ticks.length).toBeLessThanOrEqual(7);
    expect(d.min).toBeGreaterThan(0);
  });

  it("sin datos devuelve un dominio valido", () => {
    expect(yDomain([null])).toMatchObject({ min: 0, max: 1 });
  });
});

describe("flux", () => {
  it("arma la consulta con toFloat, pivot e id/rango validados", () => {
    const q = fluxSerie({ bucket: "cultivo", id: "0c2cc8", range: "24h", windowSec: 300, tipo: "calefaccion" });
    expect(q).toContain('from(bucket: "cultivo")');
    expect(q).toContain("range(start: -24h)");
    expect(q).toContain('r.id == "0c2cc8"');
    expect(q).toContain("every: 300s");
    expect(q).toContain("toFloat()");
    expect(q).toContain('r._field == "calefaccion_seg"');
    const h = fluxSerie({ bucket: "cultivo", id: "0c2cc8", range: "1h", windowSec: 60, tipo: "humedad" });
    expect(h).toContain('r._field == "humedad"');
    expect(h).toContain('r._field == "humidificador_seg"');
  });

  it("rechaza ids que podrian inyectar Flux", () => {
    expect(() =>
      fluxSerie({ bucket: "cultivo", id: '0c2cc8") |> drop(', range: "1h", windowSec: 60, tipo: "calefaccion" })
    ).toThrow();
  });

  it("deduce el intervalo de muestreo (mediana, en minutos)", () => {
    const ts = [0, 5, 10, 15, 20, 26].map((m) => T0 + m * MIN);
    expect(intervaloMuestreoSeg(ts)).toBe(300);
    expect(intervaloMuestreoSeg([T0])).toBeNull();
  });
});
