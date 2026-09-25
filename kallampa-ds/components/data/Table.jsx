import React from 'react';
export function Table({ columns = [], rows = [], rowKey, onRowClick, minWidth = 560, empty = 'Sin registros.', footer, style }) {
  return (
    <div style={Object.assign({ overflowX: 'auto' }, style)}>
      <table className="table" style={{ width: '100%', minWidth: minWidth, fontSize: 13 }}>
        <thead><tr>{columns.map(c => <th key={c.key} style={{ textAlign: c.align || 'left', width: c.width }}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={rowKey ? rowKey(r, i) : i} onClick={onRowClick ? () => onRowClick(r, i) : undefined} style={onRowClick ? { cursor: 'pointer' } : undefined}>
              {columns.map(c => <td key={c.key} style={{ textAlign: c.align || 'left', height: 44, fontVariantNumeric: c.numeric ? 'tabular-nums' : undefined, whiteSpace: c.nowrap ? 'nowrap' : undefined }}>{c.render ? c.render(r, i) : r[c.key]}</td>)}
            </tr>
          ))}
          {footer || null}
        </tbody>
      </table>
      {!rows.length ? <div style={{ padding: '24px 8px', textAlign: 'center', fontSize: 13, color: 'var(--text-subtle)' }}>{empty}</div> : null}
    </div>
  );
}
