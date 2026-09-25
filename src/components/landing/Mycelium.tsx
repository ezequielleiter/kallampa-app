"use client";

import { useEffect, useState, type CSSProperties } from "react";

interface Hypha {
  d: string;
  w: number;
  style: CSSProperties;
}
interface Tip {
  x: number;
  y: number;
  style: CSSProperties;
}

/**
 * Hifas que crecen desde el borde derecho del hero, generadas con una semilla
 * fija y calculadas una sola vez al cargar el modulo.
 */
function generar(): { hyphae: Hypha[]; tips: Tip[] } {
  let s = 7;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const hyphae: Hypha[] = [];
  const tips: Tip[] = [];
  const grow = (x: number, y: number, a: number, len: number, d: number, t: number) => {
    const ex = x + Math.cos(a) * len;
    const ey = y + Math.sin(a) * len;
    const cx = (x + ex) / 2 + (rnd() - 0.5) * len * 0.5;
    const cy = (y + ey) / 2 + (rnd() - 0.5) * len * 0.5;
    const dur = 0.9 + rnd() * 0.6;
    hyphae.push({
      d: `M${x.toFixed(1)} ${y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
      w: Math.max(0.6, 2.2 - d * 0.3),
      style: { animation: `k-grow ${dur.toFixed(2)}s cubic-bezier(.3,.6,.3,1) ${t.toFixed(2)}s both` },
    });
    if (d >= 6 || ex < 380 || ey < -20 || ey > 780) {
      // Todo lo que va al HTML se redondea: Math.cos/sin pueden diferir en el
      // ultimo digito entre el servidor y el navegador, y un float con todos
      // sus decimales en `transformOrigin` rompia la hidratacion.
      const tx = ex.toFixed(1);
      const ty = ey.toFixed(1);
      tips.push({
        x: Number(tx),
        y: Number(ty),
        style: {
          transformOrigin: `${tx}px ${ty}px`,
          transformBox: "view-box",
          animation: `l-tip ${(2 + rnd() * 2).toFixed(2)}s ease-in-out ${(t + dur).toFixed(2)}s infinite both`,
        },
      });
      return;
    }
    const n = rnd() < 0.55 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      grow(ex, ey, a + (rnd() - 0.5) * 1.3, len * (0.72 + rnd() * 0.2), d + 1, t + dur * 0.8);
    }
  };
  for (const [x, y, a] of [
    [1180, 700, -2.5],
    [1200, 380, -3.0],
    [1120, 20, 2.6],
    [980, 760, -2.0],
  ]) {
    grow(x, y, a, 150, 0, 0.4);
  }
  return { hyphae, tips };
}

const { hyphae, tips } = generar();

/**
 * Decorativo: se dibuja recien en el navegador (no en el HTML del servidor).
 * Las hifas arrancan animadas desde largo 0, asi que no se nota, y se evita
 * cualquier diferencia de calculo servidor/navegador en la hidratacion.
 */
export function Mycelium() {
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    void Promise.resolve().then(() => setMontado(true));
  }, []);
  if (!montado) return null;

  return (
    <svg
      viewBox="0 0 1200 760"
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        inset: "-40px -20% -40px 20%",
        width: "100%",
        height: "calc(100% + 80px)",
        opacity: 0.55,
        WebkitMaskImage: "linear-gradient(to right,transparent,black 45%)",
        maskImage: "linear-gradient(to right,transparent,black 45%)",
      }}
    >
      {hyphae.map((h, i) => (
        <path
          key={i}
          d={h.d}
          pathLength={1}
          fill="none"
          stroke="var(--color-accent-600)"
          strokeWidth={h.w}
          strokeLinecap="round"
          strokeDasharray={1}
          style={h.style}
        />
      ))}
      {tips.map((t, i) => (
        <circle key={i} cx={t.x} cy={t.y} r={2.6} fill="var(--color-accent-300)" style={t.style} />
      ))}
    </svg>
  );
}
