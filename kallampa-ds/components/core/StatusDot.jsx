import React from 'react';

const COLOR = {
  'Colonizando': 'ring', 'Incubando': 'ring', 'En desarrollo': 'ring',
  'Colonizado': 'var(--status-active)', 'Listo': 'var(--status-active)', 'Fructificando': 'var(--status-active)',
  'Usado': 'var(--status-done)', 'Finalizado': 'var(--status-done)', 'Descartado': 'var(--status-done)', 'Cosechado': 'var(--status-done)',
  'Contaminado': 'var(--status-danger)',
};
export function StatusDot({ status, size = 8, style }) {
  const c = COLOR[status] || 'var(--status-done)';
  const ring = c === 'ring';
  return <span aria-hidden="true" style={Object.assign({ display: 'inline-block', width: size, height: size, borderRadius: '50%', flex: 'none', background: ring ? 'transparent' : c, boxShadow: ring ? 'inset 0 0 0 1.5px var(--color-accent)' : 'none' }, style)} />;
}
