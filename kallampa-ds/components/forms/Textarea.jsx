import React from 'react';

export function Textarea({ invalid = false, rows = 2, style, className = '', ...rest }) {
  return <textarea className={'input ' + className} rows={rows} aria-invalid={invalid || undefined}
    style={Object.assign({ minHeight: 60, font: 'inherit', fontSize: 14, resize: 'vertical' }, invalid ? { borderColor: 'var(--color-danger)' } : {}, style)} {...rest} />;
}
