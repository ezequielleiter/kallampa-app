import React from 'react';
const TONES = ['var(--color-accent)', 'var(--color-accent-700)', 'var(--color-neutral-500)', 'var(--color-neutral-700)'];
const fmt = n => '$ ' + Math.round(n).toLocaleString('es-AR');
export function CostBreakdown({ items = [], title = 'Costos', format = fmt, onAdd }) {
  const total = items.reduce((a, i) => a + i.value, 0);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={{ fontSize: 14, fontWeight: 500 }}>{title}</span><span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{format(total)}</span></div>
      <div style={{ display: 'flex', height: 6, gap: 2, borderRadius: 3, overflow: 'hidden', marginTop: 12 }}>{items.map((c, i) => <span key={i} style={{ flex: c.value, background: TONES[i % 4], transition: 'flex .4s' }} />)}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
        {items.map((c, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}><span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><span style={{ width: 8, height: 8, borderRadius: 2, background: TONES[i % 4] }} />{c.name}</span><span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-body)' }}>{format(c.value)}</span></div>)}
      </div>
      {onAdd ? <a href="#" onClick={e => { e.preventDefault(); onAdd(); }} style={{ display: 'block', fontSize: 12.5, marginTop: 12 }}>+ Agregar gasto</a> : null}
    </div>
  );
}
