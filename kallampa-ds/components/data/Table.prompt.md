Tabla de datos sobre .table de Nocturne (reglas que se desvanecen), con scroll horizontal en anchos chicos.

```jsx
<Table minWidth={680} onRowClick={openLot} rows={lots} columns={[
  { key: 'code', label: 'N° de lote', numeric: true, nowrap: true },
  { key: 'species', label: 'Hongo' },
  { key: 'stage', label: 'Etapa', render: l => <StatusTag status={l.state} /> },
]} />
```
