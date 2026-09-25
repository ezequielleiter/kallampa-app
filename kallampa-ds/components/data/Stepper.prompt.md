Etapas del proceso (Inoculación → Incubación → Fructificación → Cosecha) en la cabecera del lote; varias pueden estar activas a la vez.

```jsx
<Stepper steps={[
  { name: 'Inoculación', meta: '07/09 · 5 frascos', state: 'done' },
  { name: 'Incubación', meta: '3 recipientes · 1 incubando', state: 'active' },
  { name: 'Fructificación', meta: '1 fructificando', state: 'active' },
  { name: 'Cosecha', meta: '4,00 kg', state: 'active' },
]} />
```
