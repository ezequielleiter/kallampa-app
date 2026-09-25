import React from 'react';
import { Card } from './Card.jsx';
export function PendingList({ title = 'Pendientes', items = [], empty = 'Nada pendiente.' }) {
  return (
    <Card highlight padding={16}>
      <div style={{ fontSize: 12, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, fontSize: 13, lineHeight: '18px' }}>
        {items.map((t, i) => <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}><i className={'ph ph-' + t.icon} style={{ fontSize: 16, flex: 'none', marginTop: 1, color: t.tone === 'danger' ? 'var(--color-danger-text)' : 'var(--color-accent)' }} /><span>{t.text}</span></div>)}
        {!items.length ? <div style={{ color: 'var(--text-subtle)' }}>{empty}</div> : null}
      </div>
    </Card>
  );
}
