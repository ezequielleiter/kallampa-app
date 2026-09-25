import React from 'react';

export function Checkbox({ label, description, boxed = false, style, ...rest }) {
  return (
    <label style={Object.assign({ display: 'flex', gap: 10, alignItems: description ? 'flex-start' : 'center', fontSize: 13, lineHeight: '18px', cursor: rest.disabled ? 'not-allowed' : 'pointer', opacity: rest.disabled ? .45 : 1 },
      boxed ? { padding: '10px 12px', borderRadius: 'var(--radius-md)', boxShadow: 'inset 0 0 0 1px var(--color-divider)' } : {}, style)}>
      <input type="checkbox" style={{ accentColor: 'var(--color-accent)', margin: description ? '2px 0 0' : 0 }} {...rest} />
      <span>{label}{description ? <span style={{ display: 'block', fontSize: 12, color: 'var(--text-subtle)' }}>{description}</span> : null}</span>
    </label>
  );
}
