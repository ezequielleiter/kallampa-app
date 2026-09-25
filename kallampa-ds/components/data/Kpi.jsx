import React from 'react';
export function Kpi({ label, value, note }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 500, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {note ? <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginTop: 2 }}>{note}</div> : null}
    </div>
  );
}
export function KpiGrid({ items = [], min = 140, style }) {
  return <div style={Object.assign({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(' + min + 'px,1fr))', gap: 12 }, style)}>{items.map((k, i) => <Kpi key={i} {...k} />)}</div>;
}
