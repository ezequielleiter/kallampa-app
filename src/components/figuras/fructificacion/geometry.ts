// Geometria estatica del invernadero de fructificacion (skill anatomy). Todo se
// calcula una vez al cargar el modulo y sale como markup SVG en dos capas: lo que
// queda detras del vapor y el aire (`atras`) y lo que los tapa (`adelante`: la
// estructura y el plastico de las caras que miran a la camara).
import * as k from "@/components/iso/iso-kit";
import * as G from "@/components/iso/lathe.mjs";
import * as A from "@/components/iso/audit.mjs";
import { tubePieces, tubeSvg } from "@/components/iso/tube.mjs";
import {
  ALERO,
  ANCHO,
  ARCOS,
  BASE,
  BASE_ALTO,
  CANO,
  CANO_PVC,
  CODO,
  CUMBRERA,
  ESTANTES,
  FONDO,
  HEIGHT,
  HUMIDIFICADOR,
  MALLA,
  MEDIO_X,
  NUDO,
  P,
  PISO,
  PLASTICO,
  SENSOR,
  TURBINA,
  WIDTH,
} from "./view";

type P3 = [number, number, number];
type Capa = "atras" | "adelante";

const at = (p: P3) => k.iso(p, P);
const S = k.solidSvg;
const Ln = k.lineSvg;
const Dots = k.dotsSvg;
const path = (points: P3[], closed = false) => k.pathOf(points.map(at), closed);

const R = A.recorder(P);
const record = R.solid;

function put(capa: Capa, centro: P3, svg: string, shapes: unknown[], name: string, bias = 0) {
  R.put({ at: centro, bias, svg, shapes, name: R.nameFor(name), capa });
}

/** Caras que miran a la camara: frente, costado derecho y faldon derecho del techo. */
const cerca = ([x, y, z]: P3) => y === FONDO || x === ANCHO || (z >= ALERO && x >= MEDIO_X);
const capaDe = (...ps: P3[]): Capa => (ps.every(cerca) ? "adelante" : "atras");

// --- Estructura: caños entre conectores ------------------------------------

const nodos = new Map<string, P3>();
const clave = (p: P3) => p.map((v) => v.toFixed(2)).join(",");
const nodo = (p: P3) => {
  nodos.set(clave(p), p);
  return p;
};
const lineas: [P3, P3][] = [];
const linea = (a: P3, b: P3) => lineas.push([nodo(a), nodo(b)]);


for (const y of ARCOS) {
  for (const x of [0, ANCHO]) linea([x, y, PISO], [x, y, ALERO]);
  linea([0, y, ALERO], [MEDIO_X, y, CUMBRERA]);
  linea([ANCHO, y, ALERO], [MEDIO_X, y, CUMBRERA]);
}
for (const y of [0, FONDO]) {
  linea([0, y, PISO], [ANCHO, y, PISO]);
  linea([0, y, ALERO], [ANCHO, y, ALERO]);
}
for (const x of [0, ANCHO]) {
  linea([x, 0, PISO], [x, FONDO, PISO]);
  linea([x, 0, ALERO], [x, FONDO, ALERO]);
}
linea([MEDIO_X, 0, CUMBRERA], [MEDIO_X, FONDO, CUMBRERA]);

for (const lado of [ESTANTES.izquierda, ESTANTES.derecha]) {
  const interior = lado.x0 === 0 ? lado.x1 : lado.x0;
  const tope = lado.niveles[lado.niveles.length - 1];
  for (const y of ARCOS) linea([interior, y, PISO], [interior, y, tope]);
  for (const z of lado.niveles) {
    for (const x of [lado.x0, lado.x1]) linea([x, 0, z], [x, FONDO, z]);
    for (const y of ARCOS) linea([lado.x0, y, z], [lado.x1, y, z]);
  }
}
// Los rieles de los estantes se apoyan en los postes interiores: sus nodos de abajo tocan el piso.
for (const lado of [ESTANTES.izquierda, ESTANTES.derecha]) {
  const interior = lado.x0 === 0 ? lado.x1 : lado.x0;
  linea([interior, 0, PISO], [interior, FONDO, PISO]);
}

/** Nodos que caen sobre un segmento (para cortar cada caño en sus uniones). */
function sobre(a: P3, b: P3) {
  const ab = G.sub3(b, a);
  const largo = G.len3(ab);
  const dir = G.mul3(ab, 1 / largo);
  return [...nodos.values()]
    .map((p) => {
      const t = G.dot3(G.sub3(p, a), dir);
      const resto = G.len3(G.sub3(G.sub3(p, a), G.mul3(dir, t)));
      return { p, t, resto };
    })
    .filter(({ t, resto }) => resto < 0.01 && t > -0.01 && t < largo + 0.01)
    .sort((m, n) => m.t - n.t)
    .map(({ p }) => p);
}

const tramos = new Map<string, [P3, P3]>();
for (const [a, b] of lineas) {
  const puntos = sobre(a, b);
  for (let i = 0; i + 1 < puntos.length; i++) {
    const [p, q] = [puntos[i], puntos[i + 1]];
    const id = [clave(p), clave(q)].sort().join("|");
    if (!tramos.has(id)) tramos.set(id, [p, q]);
  }
}

// El caño entra en el conector hasta que su borde toca la esfera.
const ENTRA = Math.sqrt(NUDO ** 2 - CANO ** 2);
const ESTRUCTURA = { owner: "estructura" };
for (const [a, b] of tramos.values()) {
  const largo = G.len3(G.sub3(b, a));
  const F = G.frameAlong(a, G.unit3(G.sub3(b, a)));
  const id = R.nameFor("estructura.caño");
  put(capaDe(a, b), G.lerp3(a, b, 0.5), S(G.disc(ENTRA, largo - ENTRA, CANO, F, P, { steps: 14 }), { tone: "mid", crease: "none" }), [record(A.disc(F, ENTRA, largo - ENTRA, CANO, { name: id, ...ESTRUCTURA }))], id);
}
for (const p of nodos.values()) {
  const id = R.nameFor("estructura.nudo");
  put(capaDe(p), p, S(G.sphereOf(p, NUDO, P, { steps: 24 }), { tone: "mid" }), [record(A.ball(p, NUDO, { name: id, ...ESTRUCTURA }))], id);
}

// --- Estantes de malla ------------------------------------------------------

for (const lado of [ESTANTES.izquierda, ESTANTES.derecha]) {
  for (const z of lado.niveles) {
    for (let i = 0; i + 1 < ARCOS.length; i++) {
      const plan = { x: lado.x0 + CANO, y: ARCOS[i] + CANO, w: lado.x1 - lado.x0 - CANO * 2, d: ARCOS[i + 1] - ARCOS[i] - CANO * 2, r: 0.6 };
      const z0 = z + CANO;
      const top = z0 + 0.4;
      const malla: string[] = [];
      for (let x = plan.x + MALLA[0]; x < plan.x + plan.w - 0.5; x += MALLA[0]) malla.push(k.lineOnTop([x, plan.y], [x, plan.y + plan.d], top, P));
      for (let y = plan.y + MALLA[1]; y < plan.y + plan.d - 0.5; y += MALLA[1]) malla.push(k.lineOnTop([plan.x, y], [plan.x + plan.w, y], top, P));
      const id = R.nameFor("estante.malla");
      put(
        "atras",
        [plan.x + plan.w / 2, plan.y + plan.d / 2, z0],
        S(k.slabOf(plan, z0, 0.4, P, 2), { tone: "mid", crease: "none", flat: true }) + Ln(malla.join(""), { tone: "faint" }),
        [record(A.box([plan.x, plan.y, z0], [plan.x + plan.w, plan.y + plan.d, top], { name: id, ...ESTRUCTURA }))],
        id
      );
    }
  }
}

// --- Humidificador ------------------------------------------------------------

const H = HUMIDIFICADOR;
const hPlan = { x: H.x, y: H.y, w: H.w, d: H.d, r: H.r };
{
  const patas = k.corners(hPlan, 4);
  const cuerpo = k.slabOf(hPlan, 1.2, H.alto - 1.2, P, 6, 0.8);
  const tapaPlan = k.insetPlan(hPlan, 1.2);
  const frente = H.y + H.d;
  const ventana = [
    [H.x + 6, frente, 6],
    [H.x + 6, frente, 24],
  ] as P3[];
  const markup =
    patas.map(([x, y]) => S(k.cylinder(x, y, 1.6, 0, 1.2, P, 16), { tone: "lo" })).join("") +
    S(cuerpo, { tone: "hi", inner: Ln(k.sideSeam(hPlan, 8, P, 6), { tone: "faint" }) }) +
    // Visor del deposito con la linea de nivel.
    Ln(path([...ventana, [H.x + 9, frente, 24], [H.x + 9, frente, 6]], true), { tone: "lo" }) +
    Ln(path([[H.x + 6, frente, 15], [H.x + 9, frente, 15]]), { tone: "mid" }) +
    S(k.slabOf(tapaPlan, H.alto, H.tapa, P, 6, 0.6), { tone: "hi" }) +
    Ln(k.planOutline(k.insetPlan(tapaPlan, 2), H.alto + H.tapa, P, 4), { tone: "faint" });
  const id = "humidificador.cuerpo";
  put("atras", [H.x + H.w / 2, H.y + H.d / 2, H.alto / 2], markup, [
    record(A.slab(hPlan, 1.2, H.alto - 1.2, { name: id })),
    record(A.slab(tapaPlan, H.alto, H.tapa, { name: `${id}.tapa` })),
    ...patas.map(([x, y]) => record(A.cylinder(x, y, 1.6, 0, 1.2, { name: R.nameFor("humidificador.pata") }))),
  ], id);

  // Perilla en el frente.
  const PF = G.frameAlong([H.x + H.w - 8, frente, 20], [0, 1, 0]);
  put("atras", [H.x + H.w - 8, frente + 1, 20], S(G.disc(0, 1.8, 2.4, PF, P), { tone: "mid" }) + Ln(G.ribsOf(PF, 0.3, 1.5, 2.4, 14, P).toString(), { tone: "faint" }), [record(A.disc(PF, 0, 1.8, 2.4, { name: "humidificador.perilla" }))], "humidificador.perilla", 0.1);

  // Boquilla de la niebla sobre la tapa.
  const BF = G.frameAlong([CANO_PVC.x, CANO_PVC.y, H.alto + H.tapa], [0, 0, 1]);
  put("atras", [CANO_PVC.x, CANO_PVC.y, H.alto + H.tapa + 1.5], S(G.disc(0, 3, CANO_PVC.r + 0.6, BF, P), { tone: "hi" }), [record(A.disc(BF, 0, 3, CANO_PVC.r + 0.6, { name: "humidificador.boquilla" }))], "humidificador.boquilla", 0.1);
}

// --- Caños y cables -------------------------------------------------------------

function tubo(capa: Capa, nombre: string, puntos: P3[], r: number, { tone = "hi", gaps = [] as [number, number][], ends = [true, true] as [boolean, boolean], limp = false, rings, bias = 0, maxLength = 14 }: { tone?: string; gaps?: [number, number][]; ends?: [boolean, boolean]; limp?: boolean; rings?: object; bias?: number; maxLength?: number } = {}) {
  const id = R.nameFor(nombre);
  R.route(id, puntos, r, { gaps, ends, limp, owner: id });
  tubePieces(puntos, r, P, { maxLength, gaps, rings }).forEach((pieza: { mid: P3; points: P3[]; radii: number[] }, i: number) =>
    put(capa, pieza.mid, tubeSvg(pieza, { tone }), [A.tube(pieza.points, pieza.radii)], `${id}:${i}`, bias)
  );
  return id;
}

// Caño de PVC con dos abrazaderas al riel del estante izquierdo.
const ABRAZADERA = 0.8;
const rielX = ESTANTES.izquierda.x1 + CANO;
const abrazaderas = ESTANTES.izquierda.niveles.filter((z) => z > CANO_PVC.desde + 3 && z < CANO_PVC.hasta - 3);
const pvc = tubo(
  "atras",
  "pvc.caño",
  [
    [CANO_PVC.x, CANO_PVC.y, CANO_PVC.desde],
    [CANO_PVC.x, CANO_PVC.y, CANO_PVC.hasta],
  ],
  CANO_PVC.r,
  { gaps: abrazaderas.map((z) => [z - CANO_PVC.desde - ABRAZADERA, z - CANO_PVC.desde + ABRAZADERA] as [number, number]) }
);
for (const z of abrazaderas) {
  const F = G.frameAlong([CANO_PVC.x, CANO_PVC.y, z], [0, 0, 1]);
  const id = R.nameFor("pvc.abrazadera");
  put("atras", [CANO_PVC.x, CANO_PVC.y, z], S(G.disc(-ABRAZADERA, ABRAZADERA, CANO_PVC.r + 0.6, F, P), { tone: "mid" }), [record(A.disc(F, -ABRAZADERA, ABRAZADERA, CANO_PVC.r + 0.6, { name: id, owner: pvc }))], id, 0.1);
  // Brazo hasta el riel del estante.
  const BF = G.frameAlong([CANO_PVC.x - CANO_PVC.r - 0.6, CANO_PVC.y, z], [-1, 0, 0]);
  const largo = CANO_PVC.x - CANO_PVC.r - 0.6 - rielX;
  const bid = R.nameFor("pvc.brazo");
  put("atras", [CANO_PVC.x - CANO_PVC.r - largo / 2, CANO_PVC.y, z], S(G.disc(0, largo, 0.6, BF, P, { steps: 12 }), { tone: "mid", crease: "none" }), [record(A.disc(BF, 0, largo, 0.6, { name: bid, owner: pvc }))], bid, 0.1);
}
// Manguito entre el caño y el codo.
const MANGUITO = 3.5;
{
  const F = G.frameAlong([CANO_PVC.x, CANO_PVC.y, CANO_PVC.hasta], [0, 0, 1]);
  put("atras", [CANO_PVC.x, CANO_PVC.y, CANO_PVC.hasta + MANGUITO / 2], S(G.disc(0, MANGUITO, CODO.r, F, P), { tone: "hi" }), [record(A.disc(F, 0, MANGUITO, CODO.r, { name: "pvc.manguito" }))], "pvc.manguito");
}
// Codo: arranca en el manguito y larga el vapor hacia el fondo.
tubo(
  "atras",
  "pvc.codo",
  G.fillet(
    [
      [CANO_PVC.x, CANO_PVC.y, CANO_PVC.hasta + MANGUITO],
      [CANO_PVC.x, CANO_PVC.y, CODO.z],
      CODO.boca,
    ],
    CODO.curva,
    10
  ),
  CODO.r,
  { ends: [true, false] }
);

// Zapatilla en el piso, al fondo en el medio.
const ZAPATILLA = { x: 58, y: 6, w: 18, d: 6, r: 1 };
{
  const top = 3;
  const tomas = [0, 1, 2].map((i) => [ZAPATILLA.x + 4 + i * 5, ZAPATILLA.y + 3] as [number, number]);
  put(
    "atras",
    [ZAPATILLA.x + ZAPATILLA.w / 2, ZAPATILLA.y + 3, 1.5],
    S(k.slabOf(ZAPATILLA, 0, top, P, 3, 0.4), { tone: "mid" }) +
      Ln(tomas.map(([x, y]) => k.ring(x, y, 1.2, top, P, 14)).join(""), { tone: "lo" }) +
      Dots(tomas.flatMap(([x, y]) => [at([x - 0.4, y, top]), at([x + 0.4, y, top])]), { size: 0.35, tone: "lo" }),
    [record(A.slab(ZAPATILLA, 0, top, { name: "zapatilla" }))],
    "zapatilla"
  );
}
const CABLE = 0.5;
// Cable del humidificador: sale por atras y va por el piso hasta la zapatilla.
tubo(
  "atras",
  "cable.humidificador",
  G.fillet(
    [
      [H.x + 15, H.y, 5],
      [H.x + 15, H.y - 4, 5],
      [H.x + 15, H.y - 9, 1],
      [66, 30, 1],
      [66, ZAPATILLA.y + ZAPATILLA.d, 1.5],
    ],
    6,
    10
  ),
  CABLE,
  { tone: "mid", limp: true }
);

// --- Turbina en linea --------------------------------------------------------

const T = TURBINA;
const TF = G.frameOf([T.x, T.boca, T.z], [0, -1, 0], [1, 0, 0], [0, 0, 1]);
const largoT = T.boca - T.salida;
const perfil: [number, number, number?][] = [
  [0, T.collarin],
  [5, T.collarin],
  [6, T.collarin + 1.5],
  [9, T.radio],
  [largoT - 9, T.radio],
  [largoT - 6, T.collarin + 1.5],
  [largoT - 5, T.collarin],
  [largoT, T.collarin],
];
/** Palas del rotor vistas por la boca, en 36 angulos de un paso de pala (5 palas = 72°). */
export const ROTOR: string[] = Array.from({ length: 36 }, (_, i) =>
  G.spokesOf(TF, 1.6, 1.1, T.collarin - 0.9, 5, P, { phase: (i / 36) * ((Math.PI * 2) / 5), sweep: 0.55 })
);
{
  const id = "turbina.cuerpo";
  const cuerpo = G.solidOf(perfil, TF, P);
  const bandas = Ln([9.5, largoT - 9.5].map((s) => G.arcOf(TF, s, T.radio, P)).join(""), { tone: "faint" });
  // Boca: hueco oscuro, rotor (lo mueve live.tsx) y reja encima.
  const hueco = `<path class="fr-hueco" d="${G.circleOf(TF, 0, T.collarin - 0.5, P, 36)}"/>`;
  const reja = Ln(G.circleOf(TF, -0.05, T.collarin - 1.6, P, 36) + G.circleOf(TF, -0.05, T.collarin - 3, P, 28) + G.spokesOf(TF, -0.05, 0.6, T.collarin - 0.5, 6, P), { tone: "lo" });
  const cubo = `<path class="fr-cubo" d="${G.circleOf(TF, 1, 1.1, P, 16)}"/>`;
  const rotor = `<path class="iso-line fr-rotor" data-tone="mid" data-rotor d="${ROTOR[0]}"/>`;
  put("atras", [T.x, (T.boca + T.salida) / 2, T.z], S(cuerpo, { tone: "hi", inner: bandas }) + hueco + rotor + cubo + reja, [record(A.solid(TF, perfil, { name: id }))], id);

  // Cunas que la sostienen en el piso.
  for (const s of [12, largoT - 12]) {
    const y = T.boca - s;
    const plan = { x: T.x - 7, y: y - 1.5, w: 14, d: 3, r: 0.5 };
    const alto = T.z - T.radio;
    const cid = R.nameFor("turbina.cuna");
    put("atras", [T.x, y, alto / 2], S(k.slabOf(plan, 0, alto, P, 2, 0.3), { tone: "mid" }) + Dots(k.corners(plan, 1.2).map(([x, yy]) => at([x, yy, alto])), { size: 0.35 }), [record(A.slab(plan, 0, alto, { name: cid }))], cid, -0.1);
  }

  // Prensacable en el costado que da al pasillo.
  const GF = G.frameAlong([T.x - T.radio, T.boca - largoT / 2, T.z], [-1, 0, 0]);
  put("atras", [T.x - T.radio - 1, T.boca - largoT / 2, T.z], S(G.disc(-0.2, 2, 1.4, GF, P), { tone: "mid" }), [record(A.disc(GF, -0.2, 2, 1.4, { name: "turbina.prensacable", owner: id }))], "turbina.prensacable", 0.1);
}

// Conducto flexible de 4" que atraviesa el plastico del fondo con una abrazadera.
const conductoGap: [number, number] = [T.salida - 0.9, T.salida + 0.9];
const conducto = tubo(
  "atras",
  "conducto",
  [
    [T.x, T.salida, T.z],
    [T.x, T.afuera, T.z],
  ],
  T.collarin,
  { tone: "mid", gaps: [conductoGap], ends: [true, false], rings: { pitch: 1.6, tone: "lo" }, maxLength: 8 }
);
{
  const F = G.frameAlong([T.x, 0, T.z], [0, -1, 0]);
  put("atras", [T.x, 0, T.z], S(G.disc(-0.9, 0.9, T.collarin + 1, F, P), { tone: "mid" }), [record(A.disc(F, -0.9, 0.9, T.collarin + 1, { name: "conducto.abrazadera", owner: conducto }))], "conducto.abrazadera", 0.1);
}

// Regulador de velocidad en el piso, con su cable a la turbina y a la zapatilla.
const REGULADOR = { x: 84, y: 22, w: 8, d: 10, r: 1 };
{
  const alto = 5;
  const PF = G.frameAlong([REGULADOR.x + REGULADOR.w / 2, REGULADOR.y + REGULADOR.d / 2, alto], [0, 0, 1]);
  put(
    "atras",
    [REGULADOR.x + 4, REGULADOR.y + 5, alto / 2],
    S(k.slabOf(REGULADOR, 0, alto, P, 3, 0.4), { tone: "mid" }) + S(G.disc(0, 1.6, 2, PF, P), { tone: "hi" }) + Dots([at([REGULADOR.x + 4, REGULADOR.y + 3.6, alto + 1.6])], { size: 0.4, tone: "lo" }),
    [record(A.slab(REGULADOR, 0, alto, { name: "regulador" })), record(A.disc(PF, 0, 1.6, 2, { name: "regulador.perilla", owner: "regulador" }))],
    "regulador"
  );
}
tubo(
  "atras",
  "cable.turbina",
  G.fillet(
    [
      [T.x - T.radio - 2, T.boca - largoT / 2, T.z],
      [REGULADOR.x + REGULADOR.w + 3, T.boca - largoT / 2, T.z],
      [REGULADOR.x + REGULADOR.w + 3, REGULADOR.y + 5, 2.5],
      [REGULADOR.x + REGULADOR.w, REGULADOR.y + 5, 2.5],
    ],
    3,
    10
  ),
  CABLE,
  { tone: "mid", limp: true }
);
tubo(
  "atras",
  "cable.regulador",
  G.fillet(
    [
      [REGULADOR.x, REGULADOR.y + 5, 1.5],
      [80, REGULADOR.y + 5, 1.5],
      [80, ZAPATILLA.y + 3, 1.5],
      [ZAPATILLA.x + ZAPATILLA.w, ZAPATILLA.y + 3, 1.5],
    ],
    5,
    10
  ),
  CABLE,
  { tone: "mid", limp: true }
);

// --- Sensor colgado de la cumbrera ----------------------------------------------

{
  const plan = { x: SENSOR.x - SENSOR.w / 2, y: SENSOR.y - SENSOR.d / 2, w: SENSOR.w, d: SENSOR.d, r: 0.8 };
  const frente = plan.y + plan.d;
  const ranuras = [0, 1, 2, 3].map((i) => {
    const z = SENSOR.z0 + 2 + i * 1.8;
    return path([[plan.x + 1.2, frente, z], [plan.x + plan.w - 1.2, frente, z], [plan.x + plan.w - 1.2, frente, z + 0.7], [plan.x + 1.2, frente, z + 0.7]], true);
  });
  put("atras", [SENSOR.x, SENSOR.y, (SENSOR.z0 + SENSOR.z1) / 2], S(k.slabOf(plan, SENSOR.z0, SENSOR.z1 - SENSOR.z0, P, 3, 0.4), { tone: "hi" }) + Ln(ranuras.join(""), { tone: "lo" }), [record(A.slab(plan, SENSOR.z0, SENSOR.z1 - SENSOR.z0, { name: "sensor" }))], "sensor");
}
// Alambre rigido del que cuelga (toca el caño de la cumbrera por abajo).
tubo(
  "atras",
  "sensor.alambre",
  [
    [SENSOR.x, SENSOR.y, SENSOR.z1],
    [SENSOR.x, SENSOR.y, CUMBRERA - CANO],
  ],
  0.25,
  { tone: "mid" }
);

// --- Piso, plastico y armado de capas --------------------------------------------------

A.settle(R, P);
type Item = { key: number; svg: string; capa: Capa };
const items = (R.items as Item[]).slice().sort((a, b) => a.key - b.key);

const film = (puntos: P3[]) => `<path class="fr-plastico" d="${path(puntos, true)}"/>`;
const o = PLASTICO;
const PANELES = {
  fondo: [[-o, -o, 0], [ANCHO + o, -o, 0], [ANCHO + o, -o, ALERO], [MEDIO_X, -o, CUMBRERA + o], [-o, -o, ALERO]] as P3[],
  izquierda: [[-o, -o, 0], [-o, FONDO + o, 0], [-o, FONDO + o, ALERO], [-o, -o, ALERO]] as P3[],
  techoIzquierdo: [[-o, -o, ALERO], [-o, FONDO + o, ALERO], [MEDIO_X, FONDO + o, CUMBRERA + o], [MEDIO_X, -o, CUMBRERA + o]] as P3[],
  frente: [[-o, FONDO + o, 0], [ANCHO + o, FONDO + o, 0], [ANCHO + o, FONDO + o, ALERO], [MEDIO_X, FONDO + o, CUMBRERA + o], [-o, FONDO + o, ALERO]] as P3[],
  derecha: [[ANCHO + o, -o, 0], [ANCHO + o, FONDO + o, 0], [ANCHO + o, FONDO + o, ALERO], [ANCHO + o, -o, ALERO]] as P3[],
  techoDerecho: [[ANCHO + o, -o, ALERO], [ANCHO + o, FONDO + o, ALERO], [MEDIO_X, FONDO + o, CUMBRERA + o], [MEDIO_X, -o, CUMBRERA + o]] as P3[],
};
// Puerta con cierre en el frente: una U invertida con el tirador.
const yF = FONDO + o;
const puerta = path([[46, yF, 0], [46, yF, 138], [97, yF, 138], [97, yF, 0]]);
const tirador = at([97, yF, 96]);

const base = { x: BASE.x, y: BASE.y, w: BASE.w, d: BASE.d, r: BASE.r };
record(A.box([BASE.x, BASE.y, -BASE_ALTO], [BASE.x + BASE.w, BASE.y + BASE.d, 0], { name: "stand.piso", ground: true }));
const placa = { x: BASE.x + BASE.w - 46, y: BASE.y + BASE.d - 13, w: 34, d: 8, r: 1 };
const piso =
  `<path class="iso-halo" d="${k.haloOf(base, -BASE_ALTO, BASE_ALTO, P)}"/>` +
  S(k.slabOf(base, -BASE_ALTO, BASE_ALTO, P, 8, 1.2), { tone: "lo" }) +
  Ln(k.planOutline(k.insetPlan(base, 5), 0, P), { tone: "faint" }) +
  Dots(k.corners(base, 10).map(([x, y]) => at([x, y, 0])), { size: 0.5 }) +
  S(k.slabOf(placa, 0, 0.6, P, 3), { tone: "lo", crease: "none" }) +
  k.faceTextSvg(k.topMatrix([placa.x + 3, placa.y + 5.2], 0.6, P), "INV-2.1M-PVC", { size: 3.2, tone: "lo" }) +
  Dots([at([placa.x + 1.5, placa.y + 4, 0.6]), at([placa.x + placa.w - 1.5, placa.y + 4, 0.6])], { size: 0.35 });

export const ATRAS =
  piso +
  film(PANELES.fondo) +
  film(PANELES.izquierda) +
  film(PANELES.techoIzquierdo) +
  items
    .filter((i) => i.capa === "atras")
    .map((i) => i.svg)
    .join("");

export const ADELANTE =
  items
    .filter((i) => i.capa === "adelante")
    .map((i) => i.svg)
    .join("") +
  film(PANELES.techoDerecho) +
  film(PANELES.derecha) +
  film(PANELES.frente) +
  Ln(puerta, { tone: "lo" }) +
  Dots([tirador], { size: 0.8, tone: "mid" });

// Respaldo sin WebGL: volutas de niebla y hilos de aire con trazos que avanzan.
// Cada linea nace en su boca y termina libre (se desvanece en el aire).
const voluta = (desde: P3, hacia: (s: number) => P3, largo: number) =>
  Ln(path(Array.from({ length: 13 }, (_, i) => hacia((i / 12) * largo)).map((q) => G.add3(desde, q))), { tone: "mid", flow: true, free: "end" });
export const RESPALDO =
  `<g class="fr-respaldo" data-fx="niebla">` +
  [-1.6, 0, 1.6]
    .map((dx, i) => voluta(CODO.boca, (s) => [dx * (1 + s / 18), -s, -0.004 * s * s - i * 0.8], 40 + i * 6))
    .join("") +
  `</g><g class="fr-respaldo" data-fx="aire">` +
  [-9, 0, 9]
    .map((dx, i) => Ln(path([[T.x + dx * 1.6, T.boca + 34, T.z + 4 + i * 3], [T.x + dx * 0.5, T.boca + 12, T.z + 1], [T.x, T.boca + 0.5, T.z]]), { tone: "mid", flow: true, free: "start" }))
    .join("") +
  [-5, 0, 5].map((dx) => voluta([T.x, T.afuera - 0.5, T.z], (s) => [dx * (s / 30), -s, dx * 0.1 * (s / 30)], 46)).join("") +
  `</g>`;

export { WIDTH, HEIGHT, R as RECORDER };
export const TF_TURBINA = TF;
