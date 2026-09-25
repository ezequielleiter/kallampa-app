import React from 'react';

const ERR = { borderColor: 'var(--color-danger)', boxShadow: '0 0 0 1px var(--color-danger)' };
export function Input({ prefix, suffix, invalid = false, style, className = '', ...rest }) {
  const pad = Object.assign({ boxSizing: 'border-box' }, prefix ? { paddingLeft: 24 } : {}, suffix ? { paddingRight: 34 } : {}, invalid ? ERR : {}, rest.type === 'date' ? { colorScheme: 'dark' } : {}, style);
  const input = <input className={'input ' + className} aria-invalid={invalid || undefined} style={pad} {...rest} />;
  if (!prefix && !suffix) return input;
  const aff = { position: 'absolute', top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-subtle)', pointerEvents: 'none' };
  return (
    <div style={{ position: 'relative' }}>
      {prefix ? <span style={Object.assign({ left: 10 }, aff)}>{prefix}</span> : null}
      {input}
      {suffix ? <span style={Object.assign({ right: 10 }, aff)}>{suffix}</span> : null}
    </div>
  );
}
