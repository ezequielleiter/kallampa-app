import React from 'react';

import { StatusDot } from '../core/StatusDot.jsx';
export function StateSelect({ value, options, onChange, label = 'Estado', width = 150 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <StatusDot status={value} />
      <select className="input" aria-label={label} value={value} onChange={e => onChange && onChange(e.target.value)}
        style={{ width: width, minHeight: 30, padding: '3px 8px', fontSize: 12.5, cursor: 'pointer' }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
