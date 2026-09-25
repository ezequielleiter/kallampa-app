import React from 'react';
export function Toast({ message, icon = 'check-circle', duration = 3200, onDone }) {
  React.useEffect(() => { if (!message) return; const t = setTimeout(() => onDone && onDone(), duration); return () => clearTimeout(t); }, [message]);
  if (!message) return null;
  return (
    <div role="status" key={message} style={{ position: 'fixed', left: 0, right: 0, margin: '0 auto', width: 'fit-content', bottom: 24, zIndex: 30, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)', boxShadow: 'var(--shadow-lg)', fontSize: 13, animation: 'k-toast ' + duration + 'ms ease-out both' }}>
      <i className={'ph ph-' + icon} style={{ fontSize: 17, color: 'var(--color-accent)' }} />{message}
    </div>
  );
}
