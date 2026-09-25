import React from 'react';

export function Field({ label, htmlFor, hint, error, optional = false, children, style }) {
  return (
    <div className="field" style={style}>
      {label ? <label htmlFor={htmlFor}>{label}{optional ? <span style={{ color: 'var(--text-subtle)' }}> (opcional)</span> : null}</label> : null}
      {children}
      {error ? (
        <div role="alert" style={{ display: 'flex', gap: 5, marginTop: 6, fontSize: 12, lineHeight: '17px', color: 'var(--color-danger-text)' }}>
          <i className="ph ph-warning-circle" style={{ fontSize: 14, flex: 'none', marginTop: 1 }} />{error}
        </div>
      ) : hint ? <div style={{ marginTop: 6, fontSize: 12, lineHeight: '17px', color: 'var(--text-subtle)' }}>{hint}</div> : null}
    </div>
  );
}
