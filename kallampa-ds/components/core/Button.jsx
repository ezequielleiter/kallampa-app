import React from 'react';

export function Button({ variant = 'primary', icon, iconRight, loading = false, block = false, type = 'button', children, className = '', style, ...rest }) {
  const cls = ['btn', 'btn-' + variant, block ? 'btn-block' : '', className].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} {...rest} disabled={rest.disabled || loading} aria-busy={loading || undefined}
      style={Object.assign(block ? { justifyContent: 'center' } : {}, style)}>
      {loading ? <i className="ph ph-circle-notch" style={{ animation: 'k-spin .8s linear infinite' }} /> : icon ? <i className={'ph ph-' + icon} /> : null}
      {children}
      {iconRight ? <i className={'ph ph-' + iconRight} /> : null}
    </button>
  );
}
