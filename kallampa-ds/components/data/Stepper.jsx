import React from 'react';
export function Stepper({ steps = [], min = 130 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(' + min + 'px,1fr))', rowGap: 16 }}>
      {steps.map((s, i) => {
        const done = s.state === 'done', active = s.state === 'active', pending = !done && !active;
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center', boxSizing: 'border-box', background: done ? 'var(--color-accent-800)' : 'var(--color-bg)', color: 'var(--color-accent-100)', border: '1.5px solid ' + (pending ? 'var(--color-neutral-600)' : 'var(--color-accent)'), boxShadow: active ? '0 0 0 4px color-mix(in srgb,var(--color-accent) 20%,transparent)' : 'none' }}>
                {done ? <i className="ph ph-check" style={{ fontSize: 11 }} /> : null}
              </span>
              <span style={{ flex: 1, height: 1, margin: '0 8px', background: i === steps.length - 1 ? 'transparent' : 'var(--color-accent-600)' }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
            {s.meta ? <div style={{ fontSize: 12, color: 'var(--text-subtle)', fontVariantNumeric: 'tabular-nums' }}>{s.meta}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
