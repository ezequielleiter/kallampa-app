import { cn } from "@/lib/utils";

/**
 * Simbolo de Kallampa (opcion 2e): sombrero y pie sobre una linea de suelo,
 * micelio debajo en acento. Wordmark en minusculas, Inter 500.
 */
export function Logo({
  size = 24,
  wordmark = true,
  animated = false,
  className,
}: {
  size?: number;
  wordmark?: boolean;
  animated?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center font-medium tracking-[-0.02em] text-text", className)}
      style={{ gap: Math.round(size / 3), fontSize: Math.round(size * 0.62) }}
    >
      <svg
        viewBox="0 0 48 48"
        width={size}
        height={size}
        aria-hidden="true"
        className="shrink-0 overflow-visible"
      >
        <g
          style={
            animated
              ? {
                  transformBox: "fill-box",
                  transformOrigin: "50% 100%",
                  animation: "k-cap .8s 1.3s cubic-bezier(.2,.7,.2,1) both",
                }
              : undefined
          }
        >
          <path d="M11 20 A13 11 0 0 1 37 20 Q24 23 11 20 Z" fill="currentColor" />
          <path d="M21.6 21.4 L22.2 30 H25.8 L26.4 21.4 Z" fill="currentColor" />
        </g>
        <path
          d="M24 30 L16 36 L9 38 M16 36 L14 43 M24 30 L32 36 L39 38 M32 36 L34 43 M24 30 V44"
          pathLength={animated ? 1 : undefined}
          strokeDasharray={animated ? 1 : undefined}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={size < 32 ? 2.2 : 1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={
            animated
              ? { animation: "k-grow 1.4s .2s cubic-bezier(.3,.6,.3,1) both" }
              : undefined
          }
        />
      </svg>
      {wordmark ? <span>kallampa</span> : <span className="sr-only">Kallampa</span>}
    </span>
  );
}
