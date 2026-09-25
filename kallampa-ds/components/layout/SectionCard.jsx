import React from 'react';
import { Card } from './Card.jsx';
export function SectionCard({ number, title, meta, aside, actions, highlight = false, children }) {
  return (
    <Card highlight={highlight}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          {number ? <span style={{ fontSize: 12, color: 'var(--color-accent)', fontVariantNumeric: 'tabular-nums' }}>{number}</span> : null}
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>{title}</h2>
          {meta ? <span style={{ fontSize: 12.5, color: 'var(--text-subtle)' }}>{meta}</span> : null}
        </div>
        {aside || actions ? <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>{aside}{actions}</div> : null}
      </div>
      {children ? <div style={{ marginTop: 12 }}>{children}</div> : null}
    </Card>
  );
}
