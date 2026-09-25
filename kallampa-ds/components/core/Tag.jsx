import React from 'react';

export function Tag({ tone = 'neutral', strike = false, children, style, ...rest }) {
  const danger = tone === 'danger';
  const cls = danger ? 'tag' : 'tag tag-' + tone;
  const s = Object.assign({}, danger ? { background: 'var(--color-danger-bg)', color: 'var(--color-danger-text)' } : {}, strike ? { textDecoration: 'line-through', opacity: .8 } : {}, style);
  return <span className={cls} style={s} {...rest}>{children}</span>;
}
