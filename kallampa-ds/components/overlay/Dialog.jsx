import React from 'react';
export function Dialog({ open, title, badge, subtitle, onClose, footer, children, width = 400, onSubmit }) {
  React.useEffect(() => { if (!open) return; const k = e => { if (e.key === 'Escape' && onClose) onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [open, onClose]);
  if (!open) return null;
  const Body = onSubmit ? 'form' : 'div';
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 20, display: 'grid', placeItems: 'center', padding: 24 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'var(--surface-overlay)', backdropFilter: 'blur(3px)', animation: 'k-fade-in .2s ease-out' }} />
      <Body role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} onSubmit={onSubmit} noValidate
        style={{ position: 'relative', width: width, maxWidth: '100%', background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', animation: 'k-pop var(--dur-base) var(--ease-out)' }}>
        <div style={{ padding: '18px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><h2 style={{ margin: 0, fontSize: 17, fontWeight: 500 }}>{title}</h2>{badge}</div>
            {subtitle ? <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 5, fontVariantNumeric: 'tabular-nums' }}>{subtitle}</div> : null}
          </div>
          <button type="button" className="btn btn-ghost btn-icon" aria-label="Cerrar" onClick={onClose} style={{ width: 28, height: 28 }}><i className="ph ph-x" /></button>
        </div>
        <div style={{ padding: '4px 20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
        {footer ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--color-divider)', background: 'var(--surface-inset)' }}>{footer}</div> : null}
      </Body>
    </div>
  );
}
