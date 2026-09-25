import React from 'react';
export function ProgressDays({ value, total, status, width = 56 }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(total, 1)) * 100));
  const bg = status === 'Contaminado' ? 'var(--color-danger)' : ['Finalizado', 'Descartado', 'Usado'].includes(status) ? 'var(--color-neutral-500)' : 'var(--color-accent)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: width, height: 4, borderRadius: 2, background: 'var(--color-neutral-800)', overflow: 'hidden', display: 'block' }}>
        <span style={{ display: 'block', height: '100%', width: pct + '%', background: bg, transition: 'width .4s' }} />
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{value} / {total}</span>
    </div>
  );
}
