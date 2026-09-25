Lista seleccionable de unidades trazables (frascos de origen, micelio líquido) con estado; las no utilizables van disabled, no ocultas.

```jsx
<ChoiceList type="checkbox" name="frascos" value={sel} onChange={setSel} items={[
  { value: 'F01', label: 'ENK-L-2026-001-F01', note: 'ya usado en R01' },
  { value: 'F04', label: 'ENK-L-2026-001-F04', status: 'Contaminado', disabled: true },
  { value: 'F05', label: 'ENK-L-2026-001-F05', status: 'Colonizado' },
]} />
```
