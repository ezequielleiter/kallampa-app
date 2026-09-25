Contenedor de campo de formulario con label, ayuda y error; envolvé cada Input/Select/Textarea en un Field.

```jsx
<Field label="Peso de grano (kg)" htmlFor="kg" hint="≈ 2,00 kg por frasco" error={errors.kg}>
  <Input id="kg" inputMode="decimal" invalid={!!errors.kg} suffix="kg" />
</Field>
<Field label="Notas" optional><Textarea rows={2} /></Field>
```

Errores en voseo, concretos: "Ingresá el peso de grano.", "No puede ser una fecha futura.".
