import React from 'react';
export function Card({ padding = '16px 20px', highlight = false, inset = false, children, style, ...rest }) {
  return <div style={Object.assign({ background: inset ? 'var(--surface-inset)' : 'var(--surface-card)', borderRadius: inset ? 'var(--radius-md)' : 'var(--radius-lg)', boxShadow: inset ? 'none' : highlight ? '0 0 0 1px var(--color-accent)' : 'var(--shadow-sm)', padding: padding }, style)} {...rest}>{children}</div>;
}
