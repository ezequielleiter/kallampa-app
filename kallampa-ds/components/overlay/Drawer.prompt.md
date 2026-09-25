Panel lateral derecho (420px) para crear registros con varios campos sin perder el contexto (Nueva incubación).

```jsx
<Drawer open={open} onClose={close} onSubmit={create} title="Nueva incubación" description="Repartí grano colonizado de uno o más frascos en un nuevo recipiente con sustrato."
  footer={<><Button variant="secondary" block onClick={close}>Cancelar</Button><Button type="submit" block>Crear recipiente</Button></>}>
  …campos…
</Drawer>
```
