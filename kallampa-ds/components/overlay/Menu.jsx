import React from 'react';
export function Menu({ open, items = [], onClose, align = 'right', minWidth = 210 }) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 5 }} />
      <div role="menu" style={{ position: 'absolute', [align]: 0, top: 'calc(100% - 4px)', zIndex: 6, minWidth: minWidth, background: 'var(--surface-card)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', padding: 4, display: 'flex', flexDirection: 'column', textAlign: 'left', animation: 'k-pop var(--dur-fast) ease-out' }}>
        {items.map((m, i) => (
          <button key={i} type="button" role="menuitem" onClick={() => { m.onClick && m.onClick(); onClose && onClose(); }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-neutral-800)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: 0, borderRadius: 'var(--radius-sm)', background: 'transparent', font: 'inherit', fontSize: 13, cursor: 'pointer', textAlign: 'left', color: m.danger ? 'var(--color-danger-text)' : 'var(--color-text)' }}>
            {m.icon ? <i className={'ph ph-' + m.icon} style={{ fontSize: 15 }} /> : null}{m.label}
          </button>
        ))}
      </div>
    </>
  );
}
