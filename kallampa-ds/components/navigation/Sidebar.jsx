import React from 'react';
import { Logo } from '../core/Logo.jsx';
export function Sidebar({ items = [], user, footer, onBrandClick }) {
  return (
    <aside style={{ position: 'sticky', top: 0, height: '100vh', boxSizing: 'border-box', width: 'var(--sidebar-width)', borderRight: '1px solid var(--color-divider)', padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <a href="#" onClick={e => { e.preventDefault(); onBrandClick && onBrandClick(); }} style={{ padding: '2px 8px 18px', color: 'var(--color-text)' }}><Logo size={24} /></a>
      {items.map(n => (
        <a key={n.label} href={n.href || '#'} onClick={e => { if (!n.href) e.preventDefault(); n.onClick && n.onClick(); }} aria-current={n.active ? 'page' : undefined}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 'var(--radius-md)', fontSize: 13.5, background: n.active ? 'var(--surface-selected)' : 'transparent', color: n.active ? 'var(--color-text)' : 'var(--text-muted)', boxShadow: n.active ? 'inset 2px 0 0 var(--color-accent)' : 'none' }}>
          <i className={'ph ph-' + n.icon} style={{ fontSize: 16 }} />{n.label}
        </a>
      ))}
      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--color-divider)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {user ? <div style={{ padding: '6px 10px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-accent-800)', display: 'grid', placeItems: 'center', fontSize: 11 }}>{user.slice(0, 1).toUpperCase()}</span>{user}</div> : null}
        {footer}
      </div>
    </aside>
  );
}
