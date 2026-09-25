import type { SerieRow } from "./tipos";

// Un ciclo es una racha de ventanas consecutivas con el actuador prendido
// (onSeg > 0). Metricas segun el panel del equipo:
//  - prendidaSeg: suma de onSeg del ciclo.
//  - sube: valor de la primera ventana → maximo desde el inicio del ciclo
//    hasta la ventana anterior al proximo ciclo (incluye la inercia).
//  - ritmoPorMin: (valor ultima ventana prendida − valor primera) / minutos
//    prendida.
//  - mantuvoSeg: inicio del proximo ciclo − fin de la ultima ventana
//    prendida (su t + W). Sin proximo ciclo: "prendida ahora" si la ultima
//    ventana del rango esta prendida; si no "en curso" con el tiempo
//    transcurrido hasta `now`.
//  - caePorHora: (pico − valor de la ultima ventana antes de volver a
//    prender) / horas entre ambos; null si pasaron menos de 15 min.

export interface Ciclo {
  inicio: number;
  prendidaSeg: number;
  subeDesde: number | null;
  subeHasta: number | null;
  ritmoPorMin: number | null;
  mantuvo:
    | { tipo: "hasta_proximo"; seg: number }
    | { tipo: "prendida_ahora" }
    | { tipo: "en_curso"; seg: number };
  caePorHora: number | null;
}

export interface CiclosResumen {
  ciclos: Ciclo[];
  promedios: {
    prendidaSeg: number | null;
    ritmoPorMin: number | null;
    mantuvoSeg: number | null;
    caePorHora: number | null;
  };
}

const MIN_CAIDA_SEG = 15 * 60;
const MAX_CICLOS = 20;

function avg(xs: number[]): number | null {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

export function computeCycles(
  rowsIn: SerieRow[],
  windowSec: number,
  now: number = Date.now()
): CiclosResumen {
  const rows = [...rowsIn].sort((a, b) => a.t - b.t);
  const W = windowSec * 1000;

  // Rachas de ventanas prendidas consecutivas (una ventana faltante corta la racha).
  const rachas: { first: number; last: number }[] = [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].onSeg <= 0) continue;
    const prev = rachas[rachas.length - 1];
    const contiguo =
      prev && prev.last === i - 1 && rows[i].t - rows[i - 1].t <= W * 1.5;
    if (contiguo) prev.last = i;
    else rachas.push({ first: i, last: i });
  }

  const ciclos: Ciclo[] = rachas.map((r, k) => {
    const next = rachas[k + 1];
    const first = rows[r.first];
    const last = rows[r.last];
    const prendidaSeg = rows
      .slice(r.first, r.last + 1)
      .reduce((a, row) => a + row.onSeg, 0);

    // Tramo del ciclo: desde su inicio hasta la ventana anterior al proximo.
    const finTramo = next ? next.first - 1 : rows.length - 1;
    const tramo = rows.slice(r.first, finTramo + 1);
    let picoIdx = -1;
    for (let i = r.first; i <= finTramo; i++) {
      const v = rows[i].valor;
      if (v != null && (picoIdx === -1 || v > (rows[picoIdx].valor as number))) picoIdx = i;
    }
    const pico = picoIdx >= 0 ? (rows[picoIdx].valor as number) : null;

    const minutosPrendida = prendidaSeg / 60;
    const ritmoPorMin =
      first.valor != null && last.valor != null && minutosPrendida > 0
        ? (last.valor - first.valor) / minutosPrendida
        : null;

    const finPrendida = last.t + W;
    let mantuvo: Ciclo["mantuvo"];
    if (next) {
      mantuvo = { tipo: "hasta_proximo", seg: Math.max(0, (rows[next.first].t - finPrendida) / 1000) };
    } else if (r.last === rows.length - 1) {
      mantuvo = { tipo: "prendida_ahora" };
    } else {
      mantuvo = { tipo: "en_curso", seg: Math.max(0, (now - finPrendida) / 1000) };
    }

    // Caida: del pico a la ultima ventana antes de volver a prender (o la
    // ultima del rango si no hay proximo ciclo).
    let caePorHora: number | null = null;
    if (picoIdx >= 0 && tramo.length) {
      let ultIdx = finTramo;
      while (ultIdx > picoIdx && rows[ultIdx].valor == null) ultIdx--;
      const dtSeg = (rows[ultIdx].t - rows[picoIdx].t) / 1000;
      if (ultIdx > picoIdx && dtSeg >= MIN_CAIDA_SEG) {
        caePorHora = ((pico as number) - (rows[ultIdx].valor as number)) / (dtSeg / 3600);
      }
    }

    return {
      inicio: first.t,
      prendidaSeg,
      subeDesde: first.valor,
      subeHasta: pico,
      ritmoPorMin,
      mantuvo,
      caePorHora,
    };
  });

  const recientes = ciclos.slice(-MAX_CICLOS).reverse();
  return {
    ciclos: recientes,
    promedios: {
      prendidaSeg: avg(recientes.map((c) => c.prendidaSeg)),
      ritmoPorMin: avg(recientes.flatMap((c) => (c.ritmoPorMin == null ? [] : [c.ritmoPorMin]))),
      mantuvoSeg: avg(
        recientes.flatMap((c) => (c.mantuvo.tipo === "hasta_proximo" ? [c.mantuvo.seg] : []))
      ),
      caePorHora: avg(recientes.flatMap((c) => (c.caePorHora == null ? [] : [c.caePorHora]))),
    },
  };
}
