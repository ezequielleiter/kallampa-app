import React from 'react';
export function Drawer({ open, title, description, meta, onClose, footer, children, onSubmit, width }) {
  React.useEffect(() => { if (!open) return; const k = e => { if (e.key === 'Escape' && onClose) onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [open, onClose]);
  if (!open) return null;
  const Body = onSubmit ? 'form' : 'div';
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'var(--surface-overlay)', animation: 'k-fade-in .2s ease-out' }} />
      <Body role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} onSubmit={onSubmit} noValidate
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: width || 'var(--drawer-width)', maxWidth: '100vw', background: 'var(--surface-card)', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', animation: 'k-slide-in var(--dur-slow) var(--ease-out)' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--color-divider)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ margin: 0, fontSize: 17, fontWeight: 500 }}>{title}</h2><button type="button" className="btn btn-ghost btn-icon" aria-label="Cerrar" onClick={onClose} style={{ width: 28, height: 28 }}><i className="ph ph-x" /></button></div>
          {description ? <p style={{ margin: '6px 0 0', fontSize: 12.5, lineHeight: '18px', color: 'var(--text-muted)' }}>{description}</p> : null}
          {meta ? <div style={{ marginTop: 12 }}>{meta}</div> : null}
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflow: 'auto' }}>{children}</div>
        {footer ? <div style={{ display: 'flex', gap: 8, padding: '14px 20px', borderTop: '1px solid var(--color-divider)' }}>{footer}</div> : null}
      </Body>
    </div>
  );
}
