import React from 'react';

import { StatusTag } from '../core/StatusTag.jsx';
export function ChoiceList({ type = 'radio', name, items = [], value, onChange, invalid = false, style }) {
  const multi = type === 'checkbox';
  const isOn = v => multi ? (value || []).includes(v) : value === v;
  const toggle = v => { if (!onChange) return; if (!multi) return onChange(v); const cur = value || []; onChange(cur.includes(v) ? cur.filter(x => x !== v) : cur.concat(v)); };
  return (
    <div role={multi ? 'group' : 'radiogroup'} style={Object.assign({ borderRadius: 'var(--radius-md)', boxShadow: 'inset 0 0 0 1px ' + (invalid ? 'var(--color-danger)' : 'var(--color-divider)'), overflow: 'hidden', display: 'flex', flexDirection: 'column' }, style)}>
      {items.map((it, i) => {
        const on = isOn(it.value) && !it.disabled;
        return (
          <label key={it.value} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', fontSize: 13, cursor: it.disabled ? 'not-allowed' : 'pointer', opacity: it.disabled ? .45 : 1, background: on ? 'var(--surface-selected)' : 'transparent', borderTop: i ? '1px solid var(--color-divider)' : 0 }}>
            <input type={type} name={name} checked={on} disabled={it.disabled} onChange={() => toggle(it.value)} style={{ accentColor: 'var(--color-accent)', margin: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontVariantNumeric: 'tabular-nums' }}>{it.label}</div>
              {it.meta ? <div style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>{it.meta}</div> : null}
            </div>
            {it.status ? <StatusTag status={it.status} /> : it.note ? <span style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>{it.note}</span> : null}
          </label>
        );
      })}
    </div>
  );
}
