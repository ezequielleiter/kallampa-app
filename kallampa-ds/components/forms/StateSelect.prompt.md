Cambio de estado en línea dentro de tablas (frascos de grano, placas, micelio líquido): punto de estado + select compacto.

```jsx
<StateSelect value={jar.state} onChange={v => setJar(v)} options={['Colonizando', 'Colonizado', 'Contaminado', 'Usado']} label="Estado del frasco" />
```

Tras cambiar, confirmá con un Toast ("F02 marcado como colonizado").
