Modal centrado para tareas cortas sobre un registro (agregar/editar oleada, nuevo frasco de micelio líquido); Escape y clic afuera cierran.

```jsx
<Dialog open={open} onClose={close} onSubmit={save} title="Agregar oleada" badge={<Tag tone="accent">1ª oleada</Tag>}
  subtitle="ENK-L-2026-001-R02 · Paja de trigo · 3,00 kg"
  footer={<><Button variant="secondary" onClick={close}>Cancelar</Button><Button type="submit">Guardar oleada</Button></>}>
  <Field label="Peso cosechado"><Input suffix="kg" /></Field>
</Dialog>
```
