import React from 'react';

export function IconButton({ icon, label, variant = 'ghost', size = 28, className = '', style, ...rest }) {
  return (
    <button type="button" aria-label={label} title={label} className={['btn', 'btn-' + variant, 'btn-icon', className].join(' ')}
      style={Object.assign({ width: size, height: size }, style)} {...rest}>
      <i className={'ph ph-' + icon} style={{ fontSize: Math.round(size * 0.55) }} />
    </button>
  );
}
