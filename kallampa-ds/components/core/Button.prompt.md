Botón de acción de Kallampa; usar primary para la acción principal de cada vista (una por sección), secondary para alternativas y ghost para acciones de fila.

```jsx
<Button icon="plus">Nueva incubación</Button>
<Button variant="secondary">Cancelar</Button>
<Button variant="ghost" icon="git-branch">Clonar</Button>
<Button loading>Ingresando…</Button>
```

- `variant`: primary (contorno acento) · secondary (contorno neutro) · ghost (texto acento).
- `icon` / `iconRight`: nombres Phosphor ("arrow-right", "trash").
- `loading`, `block`, y todos los atributos nativos de <button>.
