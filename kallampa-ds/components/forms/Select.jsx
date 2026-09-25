import React from 'react';

export function Select({ options = [], placeholder, invalid = false, style, className = '', ...rest }) {
  const s = Object.assign({ cursor: 'pointer' }, invalid ? { borderColor: 'var(--color-danger)', boxShadow: '0 0 0 1px var(--color-danger)' } : {}, style);
  return (
    <select className={'input ' + className} aria-invalid={invalid || undefined} style={s} {...rest}>
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map(o => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
    </select>
  );
}
