Elección exclusiva de 2–4 opciones cortas: filtros de lista, origen de un lote o clonación, login/registro.

```jsx
<SegmentedControl name="filtro" value={f} onChange={setF} options={[{ value: 'Todos', label: 'Todos', count: 4 }, { value: 'En curso', label: 'En curso', count: 3 }]} />
<SegmentedControl block name="origen" value={o} onChange={setO} options={[{ value: 'petri', label: 'Placas Petri', icon: 'circle-half' }, { value: 'comprado', label: 'Micelio comprado', icon: 'shopping-bag' }, { value: 'grano', label: 'Frasco de grano', icon: 'grains' }]} />
```
