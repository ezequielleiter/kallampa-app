import React from 'react';

export function Logo({ size = 24, wordmark = true, animated = false, style }) {
  const grow = animated ? { animation: 'k-grow 1.4s .2s cubic-bezier(.3,.6,.3,1) both' } : undefined;
  const cap = animated ? { transformBox: 'fill-box', transformOrigin: '50% 100%', animation: 'k-cap .8s 1.3s cubic-bezier(.2,.7,.2,1) both' } : undefined;
  return (
    <span style={Object.assign({ display: 'inline-flex', alignItems: 'center', gap: Math.round(size / 3), fontSize: Math.round(size * 0.62), fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--color-text)' }, style)}>
      <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" style={{ overflow: 'visible', flex: 'none' }}>
        <g style={cap}>
          <path d="M11 20 A13 11 0 0 1 37 20 Q24 23 11 20 Z" fill="currentColor" />
          <path d="M21.6 21.4 L22.2 30 H25.8 L26.4 21.4 Z" fill="currentColor" />
        </g>
        <path d="M24 30 L16 36 L9 38 M16 36 L14 43 M24 30 L32 36 L39 38 M32 36 L34 43 M24 30 V44" pathLength={animated ? 1 : undefined} strokeDasharray={animated ? 1 : undefined}
          fill="none" stroke="var(--color-accent)" strokeWidth={size < 32 ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round" style={grow} />
      </svg>
      {wordmark ? <span>kallampa</span> : null}
      {wordmark ? null : <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Kallampa</span>}
    </span>
  );
}
