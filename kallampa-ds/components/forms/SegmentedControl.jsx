import React from 'react';

export function SegmentedControl({ name, options = [], value, onChange, block = false, style }) {
  return (
    <div className="seg" role="radiogroup" style={Object.assign({ display: block ? 'flex' : 'inline-flex', flexWrap: 'wrap' }, style)}>
      {options.map(o => (
        <label key={o.value} className="seg-opt" style={block ? { flex: '1 1 auto', justifyContent: 'center' } : undefined}>
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange && onChange(o.value)} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
          {o.icon ? <i className={'ph ph-' + o.icon} /> : null}
          {o.label}
          {o.count != null ? <span style={{ fontSize: 11.5, color: 'var(--text-subtle)', fontVariantNumeric: 'tabular-nums' }}>{o.count}</span> : null}
        </label>
      ))}
    </div>
  );
}
