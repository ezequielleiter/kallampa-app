// Lista de lotes (Producción). Usa window.KallampaDS.
window.LotesScreen = function LotesScreen({ lots, onOpen, onNew }) {
  const { Table, SegmentedControl, Button, StatusTag } = window.KallampaDS;
  const [filter, setFilter] = React.useState('Todos');
  const count = s => lots.filter(l => s === 'Todos' || l.state === s).length;
  const rows = lots.filter(l => filter === 'Todos' || l.state === filter);
  return (
    <div style={{ padding: '20px 24px 48px', maxWidth: 'var(--content-max)', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div><h1 style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>Lotes</h1><div style={{ fontSize: 13, color: 'var(--text-subtle)', marginTop: 4 }}>{count('En curso')} en curso · {count('Finalizado')} finalizados</div></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <SegmentedControl name="filtro" value={filter} onChange={setFilter} options={['Todos', 'En curso', 'Finalizado'].map(v => ({ value: v, label: v === 'Finalizado' ? 'Finalizados' : v, count: count(v) }))} />
          <Button icon="plus" onClick={onNew}>Nuevo lote</Button>
        </div>
      </div>
      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '6px 16px 10px' }}>
        <Table minWidth={680} rows={rows} onRowClick={onOpen} columns={[
          { key: 'code', label: 'N° de lote', numeric: true, nowrap: true, render: l => <strong style={{ fontWeight: 500 }}>{l.code}</strong> },
          { key: 'species', label: 'Hongo', render: l => <div><div>{l.species}</div><div style={{ fontSize: 11.5, color: 'var(--text-subtle)', fontStyle: 'italic' }}>{l.latin}</div></div> },
          { key: 'origin', label: 'Origen', render: l => <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12.5 }}><i className={'ph ph-' + (l.ml ? 'flask' : 'plant')} style={{ color: 'var(--color-accent)' }} />{l.origin}</span> },
          { key: 'start', label: 'Inicio', numeric: true },
          { key: 'stage', label: 'Etapa', render: l => l.state === 'Finalizado' ? <StatusTag status="Finalizado" /> : <StatusTag status="En curso">{l.stage}</StatusTag> },
        ]} />
      </div>
    </div>
  );
};
