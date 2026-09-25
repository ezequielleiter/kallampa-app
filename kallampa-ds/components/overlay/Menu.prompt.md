Menú contextual de fila (⋯); el padre debe tener position:relative. Acciones de cambio de etapa primero, destructivas al final en coral.

```jsx
<td style={{ position: 'relative' }}>
  <IconButton icon="dots-three" label="Acciones" onClick={() => setOpen(true)} />
  <Menu open={open} onClose={() => setOpen(false)} items={[
    { label: 'Pasar a fructificación', icon: 'arrow-right', onClick: toFruit },
    { label: 'Marcar finalizado', icon: 'check' },
    { label: 'Marcar contaminado', icon: 'warning-circle', danger: true },
    { label: 'Marcar descartado', icon: 'trash', danger: true },
  ]} />
</td>
```
