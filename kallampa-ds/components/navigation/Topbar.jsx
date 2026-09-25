import React from 'react';
export function Topbar({ crumbs = [], searchPlaceholder = 'Buscar por N° de guía…', onSearch, onScan, actions }) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 24px', borderBottom: '1px solid var(--color-divider)', background: 'color-mix(in srgb,var(--color-bg) 88%,transparent)', backdropFilter: 'blur(8px)' }}>
      <nav aria-label="Ruta" style={{ fontSize: 13, color: 'var(--text-subtle)', display: 'flex', gap: 6, alignItems: 'center', minWidth: 0 }}>
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <React.Fragment key={i}>
              {i ? <i className="ph ph-caret-right" style={{ fontSize: 11 }} /> : null}
              {c.onClick && !last ? <a href="#" onClick={e => { e.preventDefault(); c.onClick(); }} style={{ color: 'inherit' }}>{c.label}</a> : <span style={{ color: last ? 'var(--color-text)' : 'inherit', whiteSpace: 'nowrap' }}>{c.label}</span>}
            </React.Fragment>
          );
        })}
      </nav>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {actions}
        <div style={{ position: 'relative' }}>
          <i className="ph ph-magnifying-glass" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-subtle)' }} />
          <input className="input" placeholder={searchPlaceholder} onChange={e => onSearch && onSearch(e.target.value)} style={{ width: 260, paddingLeft: 30, boxSizing: 'border-box' }} />
        </div>
        <button type="button" className="btn btn-secondary btn-icon" aria-label="Escanear código" onClick={onScan}><i className="ph ph-barcode" style={{ fontSize: 16 }} /></button>
      </div>
    </div>
  );
}
