"use client";

import { useEffect, useRef } from "react";
import { glCamera, glLayer } from "@/components/iso/gl.mjs";
import { useInView, useStillness } from "@/components/iso/react/live";
import type { ArteFigura } from "../tipos";
import { largoNiebla, type EstadoFigura } from "./model";
import { FRAGMENT, UNIFORMS } from "./shader";
import { P } from "./view";

/** La niebla sale a ~0,5 m/s; el aire del conducto, mas rapido. */
const V_NIEBLA = 50;
const V_AIRE = 150;
const LARGO_AIRE = 86;
/** Vueltas por segundo que se ven en el rotor (no las reales: a esa velocidad no se veria nada). */
const VUELTAS = 1.4;
const ARRANCA = 0.8;
const FRENA = 2.5;
const PASO = (Math.PI * 2) / 5;
const MAX_DT = 1 / 30;

interface Chorro {
  cola: number;
  cabeza: number;
  nivel: number;
}

/** Avanza un chorro: con la fuente prendida crece la cabeza; apagada, la cola la alcanza y se va. */
function avanzar(c: Chorro, prendido: boolean, v: number, largo: number, dt: number) {
  if (prendido) {
    c.cola = 0;
    c.cabeza = Math.min(c.cabeza + v * dt, largo);
  } else if (c.cabeza > 0) {
    c.cola += v * dt;
    if (c.cola >= c.cabeza) c.cola = c.cabeza = 0;
  }
  const meta = c.cabeza > c.cola ? 1 : 0;
  c.nivel += (meta - c.nivel) * (1 - Math.exp(-dt / (meta ? 0.4 : 0.8)));
  return c.cabeza > 0 || c.nivel > 0.002;
}

export function FructificacionVivo({ arte, estado, label }: { arte: ArteFigura; estado: EstadoFigura; label: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const atras = useRef<SVGSVGElement>(null);
  const enPantalla = useInView(stage);
  const quieto = useStillness();
  const meta = useRef(estado);
  const largo = largoNiebla(estado.humedad);
  const sim = useRef({ niebla: { cola: 0, cabeza: 0, nivel: 0 } as Chorro, aire: { cola: 0, cabeza: 0, nivel: 0 } as Chorro, vueltas: 0, angulo: 0, reloj: 0 });
  const capa = useRef<ReturnType<typeof glLayer>>(null);
  const despertar = useRef<() => void>(() => {});

  useEffect(() => {
    meta.current = estado;
    despertar.current();
  }, [estado]);

  // La capa WebGL se crea una vez; sin WebGL (o si se pierde el contexto) queda el respaldo SVG.
  useEffect(() => {
    const c = canvas.current;
    const s = stage.current;
    if (!c || !s) return;
    capa.current = glLayer({
      canvas: c,
      fragment: FRAGMENT,
      view: [arte.width, arte.height],
      camera: glCamera(P),
      uniforms: UNIFORMS,
      onError: () => {},
    });
    if (capa.current) s.dataset.gl = "";
    const perdida = () => {
      capa.current = null;
      delete s.dataset.gl;
    };
    c.addEventListener("webglcontextlost", perdida);
    return () => c.removeEventListener("webglcontextlost", perdida);
  }, [arte.width, arte.height]);

  useEffect(() => {
    const rotor = atras.current?.querySelector<SVGPathElement>("[data-rotor]") ?? null;
    const st = sim.current;
    let frame = 0;
    let ultimo = 0;

    const pintar = () => {
      const { niebla, aire } = st;
      const i = Math.floor((((st.angulo % PASO) + PASO) % PASO) / PASO * arte.rotor.length) % arte.rotor.length;
      rotor?.setAttribute("d", arte.rotor[i]);
      const valores = {
        uNiebla: niebla.nivel,
        uNieblaTramo: [niebla.cola, niebla.cabeza],
        uLargo: largo,
        uAire: aire.nivel,
        uAireTramo: [aire.cola, aire.cabeza],
      };
      if (niebla.nivel > 0.002 || aire.nivel > 0.002) capa.current?.draw(valores, st.reloj);
      else capa.current?.clear();
    };

    if (quieto) {
      // Un cuadro quieto que igual dice que esta prendido.
      const { humidificador, extractor } = meta.current;
      Object.assign(st.niebla, humidificador ? { cola: 0, cabeza: largo * 0.85, nivel: 1 } : { cola: 0, cabeza: 0, nivel: 0 });
      Object.assign(st.aire, extractor ? { cola: 0, cabeza: LARGO_AIRE * 0.7, nivel: 1 } : { cola: 0, cabeza: 0, nivel: 0 });
      st.reloj = 3.7;
      pintar();
      despertar.current = () => {
        const e = meta.current;
        Object.assign(st.niebla, e.humidificador ? { cabeza: largo * 0.85, nivel: 1 } : { cabeza: 0, nivel: 0 });
        Object.assign(st.aire, e.extractor ? { cabeza: LARGO_AIRE * 0.7, nivel: 1 } : { cabeza: 0, nivel: 0 });
        pintar();
      };
      return () => {
        despertar.current = () => {};
      };
    }

    const tick = (ahora: number) => {
      const dt = ultimo ? Math.min((ahora - ultimo) / 1000, MAX_DT) : 1 / 60;
      ultimo = ahora;
      st.reloj += dt;
      const { humidificador, extractor } = meta.current;
      const vNiebla = avanzar(st.niebla, humidificador === true, V_NIEBLA, largo + 8, dt);
      const vAire = avanzar(st.aire, extractor === true, V_AIRE, LARGO_AIRE, dt);
      const objetivo = extractor === true ? VUELTAS : 0;
      st.vueltas += (objetivo - st.vueltas) * (1 - Math.exp(-dt / (objetivo ? ARRANCA : FRENA)));
      if (!objetivo && st.vueltas < 0.005) st.vueltas = 0;
      st.angulo += st.vueltas * Math.PI * 2 * dt;
      pintar();
      frame = vNiebla || vAire || st.vueltas > 0 ? requestAnimationFrame(tick) : 0;
    };
    const correr = () => {
      if (!frame && enPantalla) {
        ultimo = 0;
        frame = requestAnimationFrame(tick);
      }
    };
    despertar.current = correr;
    correr();
    return () => {
      cancelAnimationFrame(frame);
      despertar.current = () => {};
    };
  }, [enPantalla, quieto, largo, arte.rotor]);

  const { width, height } = arte;
  return (
    <div
      ref={stage}
      className="iso-stage fructificacion"
      style={{ position: "relative", aspectRatio: `${width} / ${height}` }}
      data-niebla={estado.humidificador ? "" : undefined}
      data-aire={estado.extractor ? "" : undefined}
    >
      <svg
        ref={atras}
        className="iso-svg fr-capa"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={label}
        focusable="false"
        dangerouslySetInnerHTML={{ __html: arte.atras + arte.respaldo }}
      />
      <canvas ref={canvas} className="fr-capa fr-gl" aria-hidden="true" />
      <svg className="iso-svg fr-capa" viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: arte.adelante }} />
    </div>
  );
}
